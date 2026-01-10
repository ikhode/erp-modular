-- Sistema de Auditoría Completo
-- Esta migración crea la función de auditoría y la tabla de logs

-- Crear tabla de auditoría
CREATE TABLE audit_logs
(
    id         UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation  VARCHAR(10)  NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id    UUID,
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_audit_logs_table_name ON audit_logs (table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_operation ON audit_logs (operation);

-- Función de auditoría genérica
CREATE OR REPLACE FUNCTION audit_trigger_function()
    RETURNS TRIGGER AS
$$
DECLARE
    old_row            JSONB;
    new_row            JSONB;
    current_user_id    UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Obtener información del usuario actual
    -- En Supabase, el usuario autenticado está disponible a través de auth.uid()
    current_user_id := auth.uid();

    -- Si hay un usuario autenticado, obtener su email
    IF current_user_id IS NOT NULL THEN
        SELECT email
        INTO current_user_email
        FROM auth.users
        WHERE id = current_user_id;
    END IF;

    -- Preparar los valores old y new como JSONB
    IF TG_OP = 'DELETE' THEN
        old_row := row_to_json(OLD)::JSONB;
        new_row := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := row_to_json(OLD)::JSONB;
        new_row := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'INSERT' THEN
        old_row := NULL;
        new_row := row_to_json(NEW)::JSONB;
    END IF;

    -- Insertar el registro de auditoría
    INSERT INTO audit_logs (table_name,
                            operation,
                            old_values,
                            new_values,
                            user_id,
                            user_email,
                            ip_address,
                            user_agent)
    VALUES (TG_TABLE_NAME,
            TG_OP,
            old_row,
            new_row,
            current_user_id,
            current_user_email,
            inet_client_addr(),
            current_setting('request.headers', true)::json ->> 'user-agent');

    -- Para operaciones INSERT y UPDATE, devolver NEW
    -- Para DELETE, devolver OLD
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para consultar logs de auditoría con filtros
CREATE OR REPLACE FUNCTION get_audit_logs(
    p_table_name VARCHAR(100) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_operation VARCHAR(10) DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
    RETURNS TABLE
            (
                id         UUID,
                table_name VARCHAR(100),
                operation  VARCHAR(10),
                old_values JSONB,
                new_values JSONB,
                user_id    UUID,
                user_email VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE,
                ip_address INET,
                user_agent TEXT
            )
AS
$$
BEGIN
    RETURN QUERY
        SELECT al.id,
               al.table_name,
               al.operation,
               al.old_values,
               al.new_values,
               al.user_id,
               al.user_email,
               al.created_at,
               al.ip_address,
               al.user_agent
        FROM audit_logs al
        WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
          AND (p_user_id IS NULL OR al.user_id = p_user_id)
          AND (p_operation IS NULL OR al.operation = p_operation)
          AND (p_date_from IS NULL OR al.created_at >= p_date_from)
          AND (p_date_to IS NULL OR al.created_at <= p_date_to)
        ORDER BY al.created_at DESC
        LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear vista para estadísticas de auditoría
CREATE VIEW audit_stats AS
SELECT table_name,
       operation,
       COUNT(*)                as total_operations,
       COUNT(DISTINCT user_id) as unique_users,
       MIN(created_at)         as first_operation,
       MAX(created_at)         as last_operation
FROM audit_logs
GROUP BY table_name, operation
ORDER BY table_name, operation;

-- Políticas RLS para audit_logs (solo administradores pueden ver)
ALTER TABLE audit_logs
    ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios con rol 'owner' o 'admin' pueden ver los logs
CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR ALL USING (
    EXISTS (SELECT 1
            FROM users u
            WHERE u.id = auth.uid()
              AND u.role_id IN (SELECT id
                                FROM roles
                                WHERE name IN ('owner', 'admin')))
    );

-- Comentarios para documentación
COMMENT ON TABLE audit_logs IS 'Tabla de auditoría que registra todos los cambios en las tablas del sistema';
COMMENT ON FUNCTION audit_trigger_function() IS 'Función trigger que registra automáticamente los cambios en las tablas auditadas';
COMMENT ON FUNCTION get_audit_logs(VARCHAR, UUID, VARCHAR, TIMESTAMP, TIMESTAMP, INTEGER, INTEGER) IS 'Función para consultar logs de auditoría con filtros avanzados';
COMMENT ON VIEW audit_stats IS 'Vista con estadísticas de operaciones de auditoría por tabla y tipo de operación';
