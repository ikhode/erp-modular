-- Crear módulo de Traslados entre Ubicaciones
-- Este módulo permite mover productos entre diferentes ubicaciones del inventario

-- Crear tabla de traslados
CREATE TABLE transfers
(
    id               UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    folio            VARCHAR(50) UNIQUE NOT NULL,
    product_id       UUID               NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity         DECIMAL(10, 2)     NOT NULL CHECK (quantity > 0),
    from_location_id UUID               NOT NULL REFERENCES locations (id),
    to_location_id   UUID               NOT NULL REFERENCES locations (id),
    transfer_date    DATE               NOT NULL DEFAULT CURRENT_DATE,
    status           VARCHAR(20)                 DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_transito', 'completado', 'cancelado')),
    notes            TEXT,
    requested_by     UUID REFERENCES auth.users (id),
    approved_by      UUID REFERENCES auth.users (id),
    completed_by     UUID REFERENCES auth.users (id),
    created_at       TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    -- Validar que las ubicaciones sean diferentes
    CONSTRAINT different_locations CHECK (from_location_id != to_location_id)
);

-- Crear tabla de movimientos de traslado (para trazabilidad)
CREATE TABLE transfer_movements
(
    id            UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    transfer_id   UUID           NOT NULL REFERENCES transfers (id) ON DELETE CASCADE,
    movement_type VARCHAR(20)    NOT NULL CHECK (movement_type IN ('salida_origen', 'entrada_destino')),
    quantity      DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    location_id   UUID           NOT NULL REFERENCES locations (id),
    performed_by  UUID REFERENCES auth.users (id),
    performed_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes         TEXT
);

-- Función para procesar traslado completo
CREATE OR REPLACE FUNCTION process_transfer(transfer_id UUID)
    RETURNS VOID AS
$$
DECLARE
    transfer_record    RECORD;
    available_quantity DECIMAL(10, 2);
BEGIN
    -- Obtener datos del traslado
    SELECT *
    INTO transfer_record
    FROM transfers
    WHERE id = transfer_id
      AND status = 'pendiente';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Traslado no encontrado o no está pendiente';
    END IF;

    -- Verificar disponibilidad en ubicación origen
    SELECT COALESCE(SUM(quantity), 0)
    INTO available_quantity
    FROM inventory
    WHERE product_id = transfer_record.product_id
      AND location_id = transfer_record.from_location_id;

    IF available_quantity < transfer_record.quantity THEN
        RAISE EXCEPTION 'No hay suficiente inventario en la ubicación origen. Disponible: %, Requerido: %',
            available_quantity, transfer_record.quantity;
    END IF;

    -- Cambiar estado a en_transito
    UPDATE transfers
    SET status     = 'en_transito',
        updated_at = NOW()
    WHERE id = transfer_id;

    -- Registrar movimiento de salida
    INSERT INTO transfer_movements (transfer_id, movement_type, quantity, location_id, performed_by, notes)
    VALUES (transfer_id, 'salida_origen', transfer_record.quantity,
            transfer_record.from_location_id, transfer_record.requested_by,
            'Salida de ubicación origen');

    -- Actualizar inventario: restar de origen
    INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                     notes)
    VALUES (transfer_record.product_id, transfer_record.from_location_id, 'traslado_salida',
            -transfer_record.quantity, 'transfer', transfer_id, 'Salida por traslado');

    -- Actualizar o insertar en inventory
    INSERT INTO inventory (product_id, location_id, quantity, updated_at)
    VALUES (transfer_record.product_id, transfer_record.from_location_id, -transfer_record.quantity, NOW())
    ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity   = inventory.quantity - transfer_record.quantity,
                      updated_at = NOW();

    -- Cambiar estado a completado
    UPDATE transfers
    SET status       = 'completado',
        completed_by = transfer_record.requested_by,
        updated_at   = NOW()
    WHERE id = transfer_id;

    -- Registrar movimiento de entrada
    INSERT INTO transfer_movements (transfer_id, movement_type, quantity, location_id, performed_by, notes)
    VALUES (transfer_id, 'entrada_destino', transfer_record.quantity,
            transfer_record.to_location_id, transfer_record.requested_by,
            'Entrada a ubicación destino');

    -- Actualizar inventario: sumar a destino
    INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                     notes)
    VALUES (transfer_record.product_id, transfer_record.to_location_id, 'traslado_entrada',
            transfer_record.quantity, 'transfer', transfer_id, 'Entrada por traslado');

    -- Actualizar o insertar en inventory
    INSERT INTO inventory (product_id, location_id, quantity, updated_at)
    VALUES (transfer_record.product_id, transfer_record.to_location_id, transfer_record.quantity, NOW())
    ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity   = inventory.quantity + transfer_record.quantity,
                      updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Función para cancelar traslado
CREATE OR REPLACE FUNCTION cancel_transfer(transfer_id UUID, cancel_reason TEXT DEFAULT '')
    RETURNS VOID AS
$$
DECLARE
    transfer_record RECORD;
BEGIN
    -- Obtener datos del traslado
    SELECT *
    INTO transfer_record
    FROM transfers
    WHERE id = transfer_id
      AND status IN ('pendiente', 'en_transito');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Traslado no encontrado o no se puede cancelar';
    END IF;

    -- Si está en tránsito, revertir movimientos
    IF transfer_record.status = 'en_transito' THEN
        -- Revertir salida de origen
        INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                         notes)
        VALUES (transfer_record.product_id, transfer_record.from_location_id, 'traslado_cancelacion',
                transfer_record.quantity, 'transfer', transfer_id, 'Cancelación: retorno a origen');

        UPDATE inventory
        SET quantity   = quantity + transfer_record.quantity,
            updated_at = NOW()
        WHERE product_id = transfer_record.product_id
          AND location_id = transfer_record.from_location_id;
    END IF;

    -- Cambiar estado a cancelado
    UPDATE transfers
    SET status     = 'cancelado',
        notes      = COALESCE(notes, '') || ' | CANCELADO: ' || cancel_reason,
        updated_at = NOW()
    WHERE id = transfer_id;

END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
CREATE TRIGGER transfers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON transfers
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER transfer_movements_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON transfer_movements
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Insertar datos de prueba
INSERT INTO transfers (product_id, quantity, from_location_id, to_location_id, notes, requested_by)
SELECT p.id,
       50.00,
       (SELECT id FROM locations WHERE name LIKE '%Bodega%' LIMIT 1),
       (SELECT id FROM locations WHERE name LIKE '%Patio%' LIMIT 1),
       'Traslado de prueba entre bodega y patio',
       NULL
FROM products p
WHERE p.name LIKE '%'
LIMIT 1;
