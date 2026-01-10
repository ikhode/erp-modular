-- Crear tabla completa de flujo de caja para control financiero
CREATE TABLE IF NOT EXISTS cash_flow
(
    id             SERIAL PRIMARY KEY,
    amount         DECIMAL(10, 2) NOT NULL,
    movement_type  VARCHAR(20) CHECK (movement_type IN ('ingreso', 'egreso')),
    source_type    VARCHAR(50) CHECK (source_type IN
                                      ('venta', 'compra', 'produccion', 'capital', 'nomina', 'gasto', 'devolucion',
                                       'otro')),
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'production_ticket', etc.
    reference_id   INTEGER,     -- ID del registro relacionado
    description    TEXT           NOT NULL,
    payment_method VARCHAR(20)              DEFAULT 'efectivo' CHECK (payment_method IN
                                                                      ('efectivo', 'transferencia', 'cheque', 'tarjeta',
                                                                       'otro')),
    created_by     INTEGER REFERENCES users (id),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_cash_flow_movement_type ON cash_flow (movement_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_source_type ON cash_flow (source_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_reference ON cash_flow (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_created_at ON cash_flow (created_at);
CREATE INDEX IF NOT EXISTS idx_cash_flow_created_by ON cash_flow (created_by);

-- Crear vista para saldo actual de caja
CREATE OR REPLACE VIEW vw_cash_balance AS
SELECT SUM(CASE WHEN movement_type = 'ingreso' THEN amount ELSE -amount END) as current_balance,
       COUNT(*)                                                              as total_movements,
       MAX(created_at)                                                       as last_movement_date
FROM cash_flow;

-- Función para registrar movimiento de caja
CREATE OR REPLACE FUNCTION register_cash_movement(
    p_amount DECIMAL,
    p_movement_type VARCHAR,
    p_source_type VARCHAR,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id INTEGER DEFAULT NULL,
    p_description TEXT,
    p_payment_method VARCHAR DEFAULT 'efectivo',
    p_created_by INTEGER DEFAULT NULL
) RETURNS INTEGER AS
$$
DECLARE
    movement_id INTEGER;
BEGIN
    INSERT INTO cash_flow (amount, movement_type, source_type, reference_type, reference_id,
                           description, payment_method, created_by)
    VALUES (p_amount, p_movement_type, p_source_type, p_reference_type, p_reference_id,
            p_description, p_payment_method, p_created_by)
    RETURNING id INTO movement_id;

    RETURN movement_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener saldo actual
CREATE OR REPLACE FUNCTION get_current_cash_balance() RETURNS DECIMAL AS
$$
DECLARE
    balance DECIMAL := 0;
BEGIN
    SELECT COALESCE(current_balance, 0) INTO balance FROM vw_cash_balance;
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_cash_flow_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON cash_flow
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Políticas RLS (Row Level Security)
ALTER TABLE cash_flow
    ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios autenticados pueden ver movimientos de caja
CREATE POLICY "cash_flow_select_policy" ON cash_flow
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Política para inserción: solo usuarios con rol admin/supervisor
CREATE POLICY "cash_flow_insert_policy" ON cash_flow
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para actualización: solo admin
CREATE POLICY "cash_flow_update_policy" ON cash_flow
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'owner')
              AND ur.id = auth.uid()::integer)
    );

-- Política para eliminación: solo admin con justificación
CREATE POLICY "cash_flow_delete_policy" ON cash_flow
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'owner')
              AND ur.id = auth.uid()::integer)
    );
