-- Crear tabla completa de ventas con estados y firmas
CREATE TABLE IF NOT EXISTS sales
(
    id                      SERIAL PRIMARY KEY,
    folio                   VARCHAR(20) UNIQUE,
    client_id               INTEGER REFERENCES clients (id),
    product_id              INTEGER REFERENCES products (id),
    quantity                DECIMAL(10, 2) NOT NULL,
    unit_price              DECIMAL(10, 2) NOT NULL,
    total_amount            DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    delivery_type           VARCHAR(20) CHECK (delivery_type IN ('cliente_recoge', 'flete_propio', 'flete_externo')),
    status                  VARCHAR(20)              DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_preparacion', 'en_transito', 'entregado')),
    -- Campos de transporte
    vehicle                 VARCHAR(100),
    driver                  VARCHAR(100),
    -- Campos de firmas digitales (base64)
    client_signature_base64 TEXT,
    driver_signature_base64 TEXT,
    -- Campos de timestamps por estado
    preparation_time        TIMESTAMP WITH TIME ZONE,
    transit_time            TIMESTAMP WITH TIME ZONE,
    delivery_time           TIMESTAMP WITH TIME ZONE,
    -- Campos adicionales
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de flete para ventas
CREATE TABLE IF NOT EXISTS sale_freight
(
    id               SERIAL PRIMARY KEY,
    sale_id          INTEGER REFERENCES sales (id) ON DELETE CASCADE,
    freight_cost     DECIMAL(10, 2),
    fuel_consumption DECIMAL(10, 2),
    distance_km      DECIMAL(10, 2),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales (product_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales (status);
CREATE INDEX IF NOT EXISTS idx_sales_folio ON sales (folio);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);

-- Función para actualizar timestamps según estado
CREATE OR REPLACE FUNCTION update_sale_timestamps()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.status = 'en_preparacion' AND OLD.status != 'en_preparacion' THEN
        NEW.preparation_time = NOW();
    ELSIF NEW.status = 'en_transito' AND OLD.status != 'en_transito' THEN
        NEW.transit_time = NOW();
    ELSIF NEW.status = 'entregado' AND OLD.status != 'entregado' THEN
        NEW.delivery_time = NOW();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE TRIGGER sale_status_trigger
    BEFORE UPDATE
    ON sales
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_sale_timestamps();

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_sales_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON sales
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sale_freight_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON sale_freight
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
