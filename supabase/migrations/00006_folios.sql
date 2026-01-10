-- Crear tabla de secuencias de folios
CREATE TABLE IF NOT EXISTS folio_sequences
(
    id             SERIAL PRIMARY KEY,
    prefix         VARCHAR(10) NOT NULL UNIQUE,
    description    TEXT,
    current_number INTEGER                  DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar secuencias iniciales
INSERT INTO folio_sequences (prefix, description, current_number)
VALUES ('PROD', 'Folios para tickets de producción', 0),
       ('COMP', 'Folios para compras', 0),
       ('VENT', 'Folios para ventas', 0),
       ('TRAS', 'Folios para traslados entre ubicaciones', 0),
       ('DEV', 'Folios para devoluciones', 0)
ON CONFLICT (prefix) DO NOTHING;

-- Función para generar folio automático
CREATE OR REPLACE FUNCTION generate_folio(p_prefix VARCHAR(10))
    RETURNS VARCHAR(20) AS
$$
DECLARE
    next_number INTEGER;
    folio       VARCHAR(20);
BEGIN
    -- Bloquear la fila para evitar race conditions
    SELECT current_number + 1
    INTO next_number
    FROM folio_sequences
    WHERE prefix = p_prefix
        FOR UPDATE;

    IF next_number IS NULL THEN
        RAISE EXCEPTION 'Prefijo de folio no encontrado: %', p_prefix;
    END IF;

    -- Generar folio con formato YYYYMMDD-XXXXX
    folio := TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 5, '0');

    -- Actualizar el contador
    UPDATE folio_sequences
    SET current_number = next_number,
        updated_at     = NOW()
    WHERE prefix = p_prefix;

    RETURN folio;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_folio_sequences_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON folio_sequences
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
