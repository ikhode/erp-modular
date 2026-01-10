-- Crear tabla completa de compras con estados y firmas
CREATE TABLE IF NOT EXISTS purchases
(
    id                          SERIAL PRIMARY KEY,
    folio                       VARCHAR(20) UNIQUE,
    provider_id                 INTEGER REFERENCES providers (id),
    product_id                  INTEGER REFERENCES products (id),
    quantity                    DECIMAL(10, 2) NOT NULL,
    unit_price                  DECIMAL(10, 2) NOT NULL,
    total_amount                DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    purchase_type               VARCHAR(20) CHECK (purchase_type IN ('parcela', 'planta')),
    status                      VARCHAR(20)              DEFAULT 'salida' CHECK (status IN ('salida', 'carga', 'regreso', 'completado')),
    -- Campos de transporte
    vehicle                     VARCHAR(100),
    driver                      VARCHAR(100),
    -- Campos de firmas digitales (base64)
    driver_signature_base64     TEXT,
    supervisor_signature_base64 TEXT,
    provider_signature_base64   TEXT,
    -- Campos de timestamps por estado
    departure_time              TIMESTAMP WITH TIME ZONE,
    loading_time                TIMESTAMP WITH TIME ZONE,
    return_time                 TIMESTAMP WITH TIME ZONE,
    completion_time             TIMESTAMP WITH TIME ZONE,
    -- Campos adicionales
    notes                       TEXT,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de flete para compras
CREATE TABLE IF NOT EXISTS purchase_freight
(
    id               SERIAL PRIMARY KEY,
    purchase_id      INTEGER REFERENCES purchases (id) ON DELETE CASCADE,
    freight_cost     DECIMAL(10, 2),
    fuel_consumption DECIMAL(10, 2),
    distance_km      DECIMAL(10, 2),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON purchases (provider_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases (product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases (status);
CREATE INDEX IF NOT EXISTS idx_purchases_folio ON purchases (folio);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases (created_at);

-- Función para actualizar timestamps según estado
CREATE OR REPLACE FUNCTION update_purchase_timestamps()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.status = 'salida' AND OLD.status != 'salida' THEN
        NEW.departure_time = NOW();
    ELSIF NEW.status = 'carga' AND OLD.status != 'carga' THEN
        NEW.loading_time = NOW();
    ELSIF NEW.status = 'regreso' AND OLD.status != 'regreso' THEN
        NEW.return_time = NOW();
    ELSIF NEW.status = 'completado' AND OLD.status != 'completado' THEN
        NEW.completion_time = NOW();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE TRIGGER purchase_status_trigger
    BEFORE UPDATE
    ON purchases
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_purchase_timestamps();

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_purchases_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON purchases
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchase_freight_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON purchase_freight
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
