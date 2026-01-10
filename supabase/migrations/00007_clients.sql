-- Crear tabla completa de clientes con datos bancarios y documentos
CREATE TABLE IF NOT EXISTS clients
(
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    rfc             VARCHAR(13)  NOT NULL UNIQUE,
    email           VARCHAR(255),
    telefono        VARCHAR(20),
    direccion       TEXT,
    -- Datos bancarios
    banco           VARCHAR(100),
    cuenta_bancaria VARCHAR(50),
    clabe           VARCHAR(18),
    -- Firma digital (base64, solo primera vez)
    firma_base64    TEXT,
    -- Estado y control
    activo          BOOLEAN                  DEFAULT true,
    notas           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de documentos de clientes
CREATE TABLE IF NOT EXISTS client_documents
(
    id             SERIAL PRIMARY KEY,
    client_id      INTEGER REFERENCES clients (id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) CHECK (tipo_documento IN
                                      ('ine', 'comprobante_domicilio', 'acta_constitutiva', 'poder_notarial',
                                       'contrato', 'otro')),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage   TEXT         NOT NULL, -- Ruta en Supabase Storage
    mime_type      VARCHAR(100),
    tamano_bytes   INTEGER,
    fecha_subida   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subido_por     INTEGER REFERENCES users (id),
    notas          TEXT
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clients_rfc ON clients (rfc);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_activo ON clients (activo);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at);
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents (client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_tipo ON client_documents (tipo_documento);

-- Función para validar RFC mexicano
CREATE OR REPLACE FUNCTION validar_rfc_mexico(rfc TEXT)
    RETURNS BOOLEAN AS
$$
DECLARE
    rfc_pattern TEXT := '^[A-ZÑ&]{3,4}[0-9]{2}[0-1][0-9][0-3][0-9][A-Z0-9]{3}$';
BEGIN
    -- RFC persona física: 13 caracteres
    -- RFC persona moral: 12 caracteres
    IF LENGTH(rfc) NOT IN (12, 13) THEN
        RETURN FALSE;
    END IF;

    -- Validar patrón básico
    IF NOT (rfc ~ rfc_pattern) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para validar que firma se almacene solo la primera vez
CREATE OR REPLACE FUNCTION validar_firma_primera_vez()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Si se está actualizando y firma_base64 ya existe, no permitir cambio
    IF TG_OP = 'UPDATE' AND OLD.firma_base64 IS NOT NULL AND NEW.firma_base64 != OLD.firma_base64 THEN
        RAISE EXCEPTION 'La firma digital solo puede establecerse una vez por cliente';
    END IF;

    -- Si es INSERT y firma_base64 está presente, validar que sea única por cliente
    IF TG_OP = 'INSERT' AND NEW.firma_base64 IS NOT NULL THEN
        -- Validar formato base64 básico
        IF NOT (NEW.firma_base64 ~ '^data:image/(png|jpeg|jpg);base64,') THEN
            RAISE EXCEPTION 'Formato de firma digital inválido';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para notificar admin al intentar borrar cliente
CREATE OR REPLACE FUNCTION notificar_admin_borrado_cliente()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Insertar en audit_logs con tipo especial de notificación
    INSERT INTO audit_logs (user_id,
                            table_name,
                            record_id,
                            operation,
                            old_values,
                            new_values,
                            changed_at,
                            ip_address,
                            user_agent)
    VALUES (NULL, -- Sistema
            'clients',
            OLD.id,
            'DELETE_ATTEMPT',
            row_to_json(OLD)::jsonb,
            NULL,
            NOW(),
            NULL,
            'SYSTEM_NOTIFICATION');

    -- Aquí se podría integrar con un sistema de notificaciones por email/SMS
    -- Por ahora solo auditamos el intento

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER validate_rfc_trigger
    BEFORE INSERT OR UPDATE
    ON clients
    FOR EACH ROW
    WHEN (NEW.rfc IS NOT NULL)
EXECUTE FUNCTION validar_rfc_mexico(NEW.rfc);

CREATE TRIGGER validate_firma_trigger
    BEFORE INSERT OR UPDATE
    ON clients
    FOR EACH ROW
EXECUTE FUNCTION validar_firma_primera_vez();

CREATE TRIGGER notify_admin_delete_trigger
    BEFORE DELETE
    ON clients
    FOR EACH ROW
EXECUTE FUNCTION notificar_admin_borrado_cliente();

-- Aplicar triggers de auditoría
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON clients
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_client_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON client_documents
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Políticas RLS (Row Level Security)
ALTER TABLE clients
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents
    ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios autenticados pueden ver clientes activos
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Política para inserción: solo usuarios con rol admin/supervisor
CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para actualización: mismo rol
CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para eliminación: solo owner/admin con confirmación especial
CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Políticas similares para documentos
CREATE POLICY "client_documents_select_policy" ON client_documents
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "client_documents_insert_policy" ON client_documents
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

CREATE POLICY "client_documents_update_policy" ON client_documents
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

CREATE POLICY "client_documents_delete_policy" ON client_documents
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );
