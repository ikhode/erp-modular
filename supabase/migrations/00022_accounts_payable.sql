-- Crear módulo de Cuentas por Pagar (CxP)
-- Este módulo maneja compras a crédito y seguimiento de pagos pendientes a proveedores

-- Crear tabla de cuentas por pagar
CREATE TABLE accounts_payable
(
    id          UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    provider_id UUID               NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    purchase_id UUID               REFERENCES purchases (id) ON DELETE SET NULL, -- Puede ser NULL para créditos manuales
    folio       VARCHAR(50) UNIQUE NOT NULL,
    amount      DECIMAL(10, 2)     NOT NULL CHECK (amount > 0),
    paid_amount DECIMAL(10, 2)           DEFAULT 0 CHECK (paid_amount >= 0),
    balance     DECIMAL(10, 2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
    due_date    DATE               NOT NULL,
    status      VARCHAR(20)              DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    description TEXT,
    terms       VARCHAR(100),                                                    -- Ej: "30 días", "contra entrega", etc.
    created_by  UUID REFERENCES auth.users (id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos/abonos a cuentas por pagar
CREATE TABLE ap_payments
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    ap_id          UUID           NOT NULL REFERENCES accounts_payable (id) ON DELETE CASCADE,
    amount         DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date   DATE           NOT NULL  DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50)    NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'cheque', 'tarjeta')),
    reference      VARCHAR(100), -- Número de referencia, folio, etc.
    notes          TEXT,
    created_by     UUID REFERENCES auth.users (id),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear vista para estado de cuenta por proveedor
CREATE VIEW vw_cxp_estado_cuenta AS
SELECT p.id                                                as provider_id,
       p.name                                              as provider_name,
       p.rfc                                               as provider_rfc,
       COUNT(ap.id)                                        as total_cuentas,
       SUM(ap.amount)                                      as total_credito,
       SUM(ap.paid_amount)                                 as total_pagado,
       SUM(ap.balance)                                     as saldo_pendiente,
       COUNT(CASE WHEN ap.status = 'vencido' THEN 1 END)   as cuentas_vencidas,
       COUNT(CASE WHEN ap.status = 'pendiente' THEN 1 END) as cuentas_pendientes,
       MIN(ap.due_date)                                    as proxima_fecha_vencimiento,
       MAX(ap.created_at)                                  as ultima_operacion
FROM providers p
         LEFT JOIN accounts_payable ap ON p.id = ap.provider_id
GROUP BY p.id, p.name, p.rfc;

-- Función para actualizar estado de cuenta por pagar basado en pagos
CREATE OR REPLACE FUNCTION update_ap_status()
    RETURNS TRIGGER AS
$$
DECLARE
    total_paid     DECIMAL(10, 2);
    account_amount DECIMAL(10, 2);
BEGIN
    -- Calcular total pagado para esta cuenta
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM ap_payments
    WHERE ap_id = NEW.ap_id;

    -- Obtener monto total de la cuenta
    SELECT amount
    INTO account_amount
    FROM accounts_payable
    WHERE id = NEW.ap_id;

    -- Actualizar pagos acumulados y estado
    UPDATE accounts_payable
    SET paid_amount = total_paid,
        status      = CASE
                          WHEN total_paid = 0 THEN 'pendiente'
                          WHEN total_paid >= account_amount THEN 'pagado'
                          WHEN total_paid > 0 AND total_paid < account_amount THEN 'parcial'
                          ELSE 'pendiente'
            END,
        updated_at  = NOW()
    WHERE id = NEW.ap_id;

    -- Marcar como vencido si está pendiente y fecha de vencimiento ha pasado
    UPDATE accounts_payable
    SET status = 'vencido'
    WHERE id = NEW.ap_id
      AND status IN ('pendiente', 'parcial')
      AND due_date < CURRENT_DATE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar cuentas vencidas diariamente
CREATE OR REPLACE FUNCTION update_overdue_ap_accounts()
    RETURNS VOID AS
$$
BEGIN
    UPDATE accounts_payable
    SET status     = 'vencido',
        updated_at = NOW()
    WHERE status IN ('pendiente', 'parcial')
      AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
CREATE TRIGGER accounts_payable_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON accounts_payable
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER ap_payments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON ap_payments
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Trigger para actualizar estado cuando se registra un pago
CREATE TRIGGER ap_payment_status_trigger
    AFTER INSERT
    ON ap_payments
    FOR EACH ROW
EXECUTE FUNCTION update_ap_status();

-- Insertar datos de prueba
INSERT INTO accounts_payable (provider_id, purchase_id, folio, amount, due_date, description, terms, created_by)
SELECT pr.id,
       NULL, -- Sin compra asociada para prueba
       'CXP-' || generate_folio('CXP'),
       2500.00,
       CURRENT_DATE + INTERVAL '45 days',
       'Crédito por compra de insumos',
       '45 días',
       NULL
FROM providers pr
WHERE pr.name LIKE '%'
LIMIT 1;

-- Insertar un pago de prueba
INSERT INTO ap_payments (ap_id, amount, payment_date, payment_method, reference, notes, created_by)
SELECT ap.id,
       1000.00,
       CURRENT_DATE,
       'transferencia',
       'Pago parcial insumos',
       'Primer abono',
       NULL
FROM accounts_payable ap
WHERE ap.folio LIKE 'CXP-%'
LIMIT 1;
