-- Crear tabla completa de proveedores con datos bancarios y documentos
CREATE TABLE IF NOT EXISTS providers
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
    tipo_proveedor  VARCHAR(20)              DEFAULT 'proveedor' CHECK (tipo_proveedor IN ('proveedor', 'transportista', 'servicio')),
    categoria       VARCHAR(50), -- frutas, verduras, insumos, etc.
    notas           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de documentos de proveedores
CREATE TABLE IF NOT EXISTS provider_documents
(
    id             SERIAL PRIMARY KEY,
    provider_id    INTEGER REFERENCES providers (id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) CHECK (tipo_documento IN
                                      ('ine', 'comprobante_domicilio', 'acta_constitutiva', 'poder_notarial',
                                       'contrato', 'licencia_conducir', 'tarjeta_circulacion', 'poliza_seguro',
                                       'otro')),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage   TEXT         NOT NULL, -- Ruta en Supabase Storage
    mime_type      VARCHAR(100),
    tamano_bytes   INTEGER,
    fecha_subida   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subido_por     INTEGER REFERENCES users (id),
    notas          TEXT
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_providers_rfc ON providers (rfc);
CREATE INDEX IF NOT EXISTS idx_providers_email ON providers (email);
CREATE INDEX IF NOT EXISTS idx_providers_activo ON providers (activo);
CREATE INDEX IF NOT EXISTS idx_providers_tipo ON providers (tipo_proveedor);
CREATE INDEX IF NOT EXISTS idx_providers_categoria ON providers (categoria);
CREATE INDEX IF NOT EXISTS idx_providers_created_at ON providers (created_at);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_documents (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_tipo ON provider_documents (tipo_documento);

-- Función para validar que firma se almacene solo la primera vez (proveedores)
CREATE OR REPLACE FUNCTION validar_firma_proveedor_primera_vez()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Si se está actualizando y firma_base64 ya existe, no permitir cambio
    IF TG_OP = 'UPDATE' AND OLD.firma_base64 IS NOT NULL AND NEW.firma_base64 != OLD.firma_base64 THEN
        RAISE EXCEPTION 'La firma digital solo puede establecerse una vez por proveedor';
    END IF;

    -- Si es INSERT y firma_base64 está presente, validar que sea única por proveedor
    IF TG_OP = 'INSERT' AND NEW.firma_base64 IS NOT NULL THEN
        -- Validar formato base64 básico
        IF NOT (NEW.firma_base64 ~ '^data:image/(png|jpeg|jpg);base64,') THEN
            RAISE EXCEPTION 'Formato de firma digital inválido';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para notificar admin al intentar borrar proveedor
CREATE OR REPLACE FUNCTION notificar_admin_borrado_proveedor()
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
            'providers',
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
CREATE TRIGGER validate_rfc_providers_trigger
    BEFORE INSERT OR UPDATE
    ON providers
    FOR EACH ROW
    WHEN (NEW.rfc IS NOT NULL)
EXECUTE FUNCTION validar_rfc_mexico(NEW.rfc);

CREATE TRIGGER validate_firma_proveedor_trigger
    BEFORE INSERT OR UPDATE
    ON providers
    FOR EACH ROW
EXECUTE FUNCTION validar_firma_proveedor_primera_vez();

CREATE TRIGGER notify_admin_delete_provider_trigger
    BEFORE DELETE
    ON providers
    FOR EACH ROW
EXECUTE FUNCTION notificar_admin_borrado_proveedor();

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_providers_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON providers
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_provider_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON provider_documents
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Políticas RLS (Row Level Security)
ALTER TABLE providers
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents
    ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios autenticados pueden ver proveedores activos
CREATE POLICY "providers_select_policy" ON providers
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Política para inserción: solo usuarios con rol admin/supervisor
CREATE POLICY "providers_insert_policy" ON providers
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para actualización: mismo rol
CREATE POLICY "providers_update_policy" ON providers
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para eliminación: solo owner/admin con confirmación especial
CREATE POLICY "providers_delete_policy" ON providers
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Políticas similares para documentos
CREATE POLICY "provider_documents_select_policy" ON provider_documents
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "provider_documents_insert_policy" ON provider_documents
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

CREATE POLICY "provider_documents_update_policy" ON provider_documents
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

CREATE POLICY "provider_documents_delete_policy" ON provider_documents
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );
