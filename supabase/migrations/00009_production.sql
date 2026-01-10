-- Crear tabla completa de tickets de producción con triple registro
CREATE TABLE IF NOT EXISTS production_tickets
(
    id                        SERIAL PRIMARY KEY,
    folio                     VARCHAR(20) UNIQUE,
    process_id                INTEGER REFERENCES processes (id),
    employee_id               INTEGER REFERENCES employees (id),
    -- Campos de insumos (JSONB para flexibilidad)
    input_items               JSONB          NOT NULL  DEFAULT '[]',
    -- Campos de producto terminado
    output_product_id         INTEGER REFERENCES products (id),
    output_quantity           DECIMAL(10, 2) NOT NULL,
    output_location_id        INTEGER REFERENCES locations (id),
    -- Campos de firma y autenticación
    employee_signature_base64 TEXT,
    face_auth_data            JSONB, -- Datos biométricos si aplica
    -- Estados del ticket
    status                    VARCHAR(20)              DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    -- Campos de pago
    payment_amount            DECIMAL(10, 2),
    payment_method            VARCHAR(20)              DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'cheque')),
    -- Campos de timestamps
    started_at                TIMESTAMP WITH TIME ZONE,
    completed_at              TIMESTAMP WITH TIME ZONE,
    paid_at                   TIMESTAMP WITH TIME ZONE,
    -- Campos adicionales
    notes                     TEXT,
    supervisor_notes          TEXT,
    quality_check             BOOLEAN                  DEFAULT false,
    quality_notes             TEXT,
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_production_tickets_folio ON production_tickets (folio);
CREATE INDEX IF NOT EXISTS idx_production_tickets_process ON production_tickets (process_id);
CREATE INDEX IF NOT EXISTS idx_production_tickets_employee ON production_tickets (employee_id);
CREATE INDEX IF NOT EXISTS idx_production_tickets_status ON production_tickets (status);
CREATE INDEX IF NOT EXISTS idx_production_tickets_created_at ON production_tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_production_tickets_output_product ON production_tickets (output_product_id);

-- Función para validar que firma se almacene solo la primera vez (producción)
CREATE OR REPLACE FUNCTION validar_firma_produccion_primera_vez()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Si se está actualizando y firma ya existe, no permitir cambio
    IF TG_OP = 'UPDATE' AND OLD.employee_signature_base64 IS NOT NULL AND
       NEW.employee_signature_base64 != OLD.employee_signature_base64 THEN
        RAISE EXCEPTION 'La firma digital del empleado solo puede establecerse una vez por ticket de producción';
    END IF;

    -- Si es INSERT y firma está presente, validar formato
    IF TG_OP = 'INSERT' AND NEW.employee_signature_base64 IS NOT NULL THEN
        -- Validar formato base64 básico
        IF NOT (NEW.employee_signature_base64 ~ '^data:image/(png|jpeg|jpg);base64,') THEN
            RAISE EXCEPTION 'Formato de firma digital inválido';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamps según estado
CREATE OR REPLACE FUNCTION update_production_timestamps()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.status = 'en_proceso' AND OLD.status != 'en_proceso' THEN
        NEW.started_at = NOW();
    ELSIF NEW.status = 'completado' AND OLD.status != 'completado' THEN
        NEW.completed_at = NOW();
    END IF;

    -- Si se marca como pagado
    IF NEW.payment_amount IS NOT NULL AND OLD.paid_at IS NULL THEN
        NEW.paid_at = NOW();
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimientos de inventario en producción
CREATE OR REPLACE FUNCTION register_production_inventory_movements()
    RETURNS TRIGGER AS
$$
DECLARE
    input_item       RECORD;
    inventory_record RECORD;
BEGIN
    -- Solo procesar cuando el ticket se completa
    IF NEW.status = 'completado' AND OLD.status != 'completado' THEN

        -- Procesar insumos (restar del inventario)
        FOR input_item IN SELECT * FROM jsonb_array_elements(NEW.input_items)
            LOOP
                -- Buscar inventario disponible para este producto y ubicación
                SELECT *
                INTO inventory_record
                FROM inventory
                WHERE product_id = (input_item.value ->> 'productId')::integer
                  AND location_id = (input_item.value ->> 'locationId')::integer
                LIMIT 1;

                IF inventory_record IS NULL THEN
                    RAISE EXCEPTION 'No hay inventario disponible para el producto % en la ubicación %',
                        (input_item.value ->> 'productId'), (input_item.value ->> 'locationId');
                END IF;

                IF inventory_record.quantity < (input_item.value ->> 'quantity')::decimal THEN
                    RAISE EXCEPTION 'Inventario insuficiente para el producto %: disponible %, requerido %',
                        (input_item.value ->> 'productId'), inventory_record.quantity, (input_item.value ->> 'quantity');
                END IF;

                -- Restar del inventario
                UPDATE inventory
                SET quantity   = quantity - (input_item.value ->> 'quantity')::decimal,
                    updated_at = NOW()
                WHERE id = inventory_record.id;

                -- Registrar movimiento
                INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type,
                                                 reference_id, notes)
                VALUES ((input_item.value ->> 'productId')::integer,
                        (input_item.value ->> 'locationId')::integer,
                        'consumo_produccion',
                        -(input_item.value ->> 'quantity')::decimal,
                        'production_ticket',
                        NEW.id,
                        'Consumo en producción - ' || NEW.folio);
            END LOOP;

        -- Sumar producto terminado al inventario
        INSERT INTO inventory (product_id, location_id, quantity, created_at, updated_at)
        VALUES (NEW.output_product_id, NEW.output_location_id, NEW.output_quantity, NOW(), NOW())
        ON CONFLICT (product_id, location_id)
            DO UPDATE SET quantity   = inventory.quantity + NEW.output_quantity,
                          updated_at = NOW();

        -- Registrar movimiento de salida
        INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                         notes)
        VALUES (NEW.output_product_id,
                NEW.output_location_id,
                'produccion',
                NEW.output_quantity,
                'production_ticket',
                NEW.id,
                'Producción terminada - ' || NEW.folio);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimiento de caja por pago de producción
CREATE OR REPLACE FUNCTION register_production_cash_movement()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Solo procesar cuando se registra el pago
    IF NEW.payment_amount IS NOT NULL AND OLD.payment_amount IS NULL THEN
        -- Registrar egreso en caja por labor
        INSERT INTO cash_flow (amount, movement_type, source_type, reference_type, reference_id,
                               description, created_by)
        VALUES (-NEW.payment_amount,
                'egreso',
                'produccion',
                'production_ticket',
                NEW.id,
                'Pago por producción - ' || NEW.folio,
                1 -- TODO: obtener del contexto de usuario actual
               );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER validate_production_signature_trigger
    BEFORE INSERT OR UPDATE
    ON production_tickets
    FOR EACH ROW
EXECUTE FUNCTION validar_firma_produccion_primera_vez();

CREATE TRIGGER update_production_status_timestamps_trigger
    BEFORE UPDATE
    ON production_tickets
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_amount IS DISTINCT FROM NEW.payment_amount)
EXECUTE FUNCTION update_production_timestamps();

CREATE TRIGGER register_production_inventory_trigger
    AFTER UPDATE
    ON production_tickets
    FOR EACH ROW
    WHEN (NEW.status = 'completado' AND OLD.status != 'completado')
EXECUTE FUNCTION register_production_inventory_movements();

CREATE TRIGGER register_production_cash_trigger
    AFTER UPDATE
    ON production_tickets
    FOR EACH ROW
    WHEN (NEW.payment_amount IS NOT NULL AND OLD.payment_amount IS NULL)
EXECUTE FUNCTION register_production_cash_movement();

-- Aplicar trigger de auditoría
CREATE TRIGGER audit_production_tickets_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON production_tickets
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Políticas RLS (Row Level Security)
ALTER TABLE production_tickets
    ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios autenticados pueden ver tickets de producción
CREATE POLICY "production_tickets_select_policy" ON production_tickets
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Política para inserción: supervisores y admins
CREATE POLICY "production_tickets_insert_policy" ON production_tickets
    FOR INSERT WITH CHECK (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor')
              AND ur.id = auth.uid()::integer)
    );

-- Política para actualización: supervisores y admins, empleados solo pueden actualizar su firma
CREATE POLICY "production_tickets_update_policy" ON production_tickets
    FOR UPDATE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin', 'supervisor')
              AND ur.id = auth.uid()::integer) OR (
        -- Empleados pueden actualizar solo su firma en tickets asignados
        employee_id = auth.uid()::integer AND
        OLD.employee_signature_base64 IS NULL AND
        NEW.employee_signature_base64 IS NOT NULL
        )
    );

-- Política para eliminación: solo admin
CREATE POLICY "production_tickets_delete_policy" ON production_tickets
    FOR DELETE USING (
    EXISTS (SELECT 1
            FROM user_roles ur
            WHERE ur.name IN ('admin')
              AND ur.id = auth.uid()::integer)
    );
