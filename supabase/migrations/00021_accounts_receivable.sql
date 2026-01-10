-- Crear módulo de Cuentas por Cobrar (CxC)
-- Este módulo maneja ventas a crédito y seguimiento de pagos pendientes

-- Crear tabla de cuentas por cobrar
CREATE TABLE accounts_receivable
(
    id          UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    client_id   UUID               NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    sale_id     UUID               REFERENCES sales (id) ON DELETE SET NULL, -- Puede ser NULL para créditos manuales
    folio       VARCHAR(50) UNIQUE NOT NULL,
    amount      DECIMAL(10, 2)     NOT NULL CHECK (amount > 0),
    paid_amount DECIMAL(10, 2)           DEFAULT 0 CHECK (paid_amount >= 0),
    balance     DECIMAL(10, 2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
    due_date    DATE               NOT NULL,
    status      VARCHAR(20)              DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    description TEXT,
    terms       VARCHAR(100),                                                -- Ej: "30 días", "contra entrega", etc.
    created_by  UUID REFERENCES auth.users (id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos/abonos a cuentas por cobrar
CREATE TABLE ar_payments
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    ar_id          UUID           NOT NULL REFERENCES accounts_receivable (id) ON DELETE CASCADE,
    amount         DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date   DATE           NOT NULL  DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50)    NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'cheque', 'tarjeta')),
    reference      VARCHAR(100), -- Número de referencia, folio, etc.
    notes          TEXT,
    created_by     UUID REFERENCES auth.users (id),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear vista para estado de cuenta por cliente
CREATE VIEW vw_cxc_estado_cuenta AS
SELECT c.id                                                as client_id,
       c.name                                              as client_name,
       c.rfc                                               as client_rfc,
       COUNT(ar.id)                                        as total_cuentas,
       SUM(ar.amount)                                      as total_credito,
       SUM(ar.paid_amount)                                 as total_pagado,
       SUM(ar.balance)                                     as saldo_pendiente,
       COUNT(CASE WHEN ar.status = 'vencido' THEN 1 END)   as cuentas_vencidas,
       COUNT(CASE WHEN ar.status = 'pendiente' THEN 1 END) as cuentas_pendientes,
       MIN(ar.due_date)                                    as proxima_fecha_vencimiento,
       MAX(ar.created_at)                                  as ultima_operacion
FROM clients c
         LEFT JOIN accounts_receivable ar ON c.id = ar.client_id
GROUP BY c.id, c.name, c.rfc;

-- Función para calcular días de vencimiento
CREATE OR REPLACE FUNCTION calculate_overdue_days(due_date DATE)
    RETURNS INTEGER AS
$$
BEGIN
    RETURN EXTRACT(DAY FROM CURRENT_DATE - due_date)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estado de cuenta por cobrar basado en pagos
CREATE OR REPLACE FUNCTION update_ar_status()
    RETURNS TRIGGER AS
$$
DECLARE
    total_paid     DECIMAL(10, 2);
    account_amount DECIMAL(10, 2);
BEGIN
    -- Calcular total pagado para esta cuenta
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM ar_payments
    WHERE ar_id = NEW.ar_id;

    -- Obtener monto total de la cuenta
    SELECT amount
    INTO account_amount
    FROM accounts_receivable
    WHERE id = NEW.ar_id;

    -- Actualizar pagos acumulados y estado
    UPDATE accounts_receivable
    SET paid_amount = total_paid,
        status      = CASE
                          WHEN total_paid = 0 THEN 'pendiente'
                          WHEN total_paid >= account_amount THEN 'pagado'
                          WHEN total_paid > 0 AND total_paid < account_amount THEN 'parcial'
                          ELSE 'pendiente'
            END,
        updated_at  = NOW()
    WHERE id = NEW.ar_id;

    -- Marcar como vencido si está pendiente y fecha de vencimiento ha pasado
    UPDATE accounts_receivable
    SET status = 'vencido'
    WHERE id = NEW.ar_id
      AND status IN ('pendiente', 'parcial')
      AND due_date < CURRENT_DATE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estado de cuentas vencidas diariamente
CREATE OR REPLACE FUNCTION update_overdue_accounts()
    RETURNS VOID AS
$$
BEGIN
    UPDATE accounts_receivable
    SET status     = 'vencido',
        updated_at = NOW()
    WHERE status IN ('pendiente', 'parcial')
      AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
CREATE TRIGGER accounts_receivable_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON accounts_receivable
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER ar_payments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON ar_payments
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Trigger para actualizar estado cuando se registra un pago
CREATE TRIGGER ar_payment_status_trigger
    AFTER INSERT
    ON ar_payments
    FOR EACH ROW
EXECUTE FUNCTION update_ar_status();

-- Insertar datos de prueba
INSERT INTO accounts_receivable (client_id, sale_id, folio, amount, due_date, description, terms, created_by)
SELECT c.id,
       NULL, -- Sin venta asociada para prueba
       'CXC-' || generate_folio('CXC'),
       1500.00,
       CURRENT_DATE + INTERVAL '30 days',
       'Crédito por venta de productos',
       '30 días',
       NULL
FROM clients c
WHERE c.name LIKE '%'
LIMIT 1;

-- Insertar un pago de prueba
INSERT INTO ar_payments (ar_id, amount, payment_date, payment_method, reference, notes, created_by)
SELECT ar.id,
       500.00,
       CURRENT_DATE,
       'efectivo',
       'Pago parcial',
       'Primer abono',
       NULL
FROM accounts_receivable ar
WHERE ar.folio LIKE 'CXC-%'
LIMIT 1;
