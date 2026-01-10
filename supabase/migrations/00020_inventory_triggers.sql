-- Crear triggers para gestión automática de inventario y flujo de caja
-- Estos triggers se ejecutan automáticamente cuando se completan compras, ventas y producción

-- Función para actualizar inventario en compras completadas
CREATE OR REPLACE FUNCTION update_inventory_on_purchase_completion()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Solo procesar cuando la compra se completa
    IF NEW.estado = 'completado' AND (OLD.estado IS NULL OR OLD.estado != 'completado') THEN
        -- Sumar al inventario del producto
        INSERT INTO inventory (product_id, location_id, quantity, created_at, updated_at)
        VALUES (NEW.product_id, 1, NEW.quantity, NOW(), NOW()) -- Default location_id = 1
        ON CONFLICT (product_id, location_id)
            DO UPDATE SET quantity   = inventory.quantity + NEW.quantity,
                          updated_at = NOW();

        -- Registrar movimiento de inventario
        INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                         notes)
        VALUES (NEW.product_id,
                1, -- Default location
                'compra',
                NEW.quantity,
                'purchase',
                NEW.id,
                'Compra completada - ' || COALESCE(NEW.folio, 'Sin folio'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar inventario en ventas completadas
CREATE OR REPLACE FUNCTION update_inventory_on_sale_completion()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Solo procesar cuando la venta se completa
    IF NEW.estado = 'entregado' AND (OLD.estado IS NULL OR OLD.estado != 'entregado') THEN
        -- Restar del inventario del producto
        UPDATE inventory
        SET quantity   = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE product_id = NEW.product_id
          AND location_id = 1 -- Default location
          AND quantity >= NEW.quantity;

        -- Verificar que se actualizó al menos una fila
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventario insuficiente para completar la venta %', COALESCE(NEW.folio, NEW.id);
        END IF;

        -- Registrar movimiento de inventario
        INSERT INTO inventory_movements (product_id, location_id, movement_type, quantity, reference_type, reference_id,
                                         notes)
        VALUES (NEW.product_id,
                1, -- Default location
                'venta',
                -NEW.quantity,
                'sale',
                NEW.id,
                'Venta completada - ' || COALESCE(NEW.folio, 'Sin folio'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimientos de caja en ventas
CREATE OR REPLACE FUNCTION register_cash_movement_on_sale()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Solo procesar cuando la venta se completa
    IF NEW.estado = 'entregado' AND (OLD.estado IS NULL OR OLD.estado != 'entregado') THEN
        -- Registrar ingreso en caja por venta
        INSERT INTO cash_flow (amount, movement_type, source_type, reference_type, reference_id,
                               description, payment_method, created_by)
        VALUES (NEW.total_amount,
                'ingreso',
                'venta',
                'sale',
                NEW.id,
                'Venta completada - ' || COALESCE(NEW.folio, 'Sin folio'),
                'efectivo', -- Default payment method
                NULL -- TODO: obtener del contexto de usuario actual
               );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimientos de caja en compras
CREATE OR REPLACE FUNCTION register_cash_movement_on_purchase()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Solo procesar cuando la compra se completa
    IF NEW.estado = 'completado' AND (OLD.estado IS NULL OR OLD.estado != 'completado') THEN
        -- Calcular el monto total de la compra
        DECLARE
            total_amount DECIMAL(10, 2);
        BEGIN
            total_amount := NEW.quantity * NEW.precio_unitario;

            -- Registrar egreso en caja por compra
            INSERT INTO cash_flow (amount, movement_type, source_type, reference_type, reference_id,
                                   description, payment_method, created_by)
            VALUES (-total_amount,
                    'egreso',
                    'compra',
                    'purchase',
                    NEW.id,
                    'Compra completada - ' || COALESCE(NEW.folio, 'Sin folio'),
                    'efectivo', -- Default payment method
                    NULL -- TODO: obtener del contexto de usuario actual
                   );
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a las tablas correspondientes

-- Triggers para compras
CREATE TRIGGER purchase_completion_inventory_trigger
    AFTER UPDATE
    ON purchases
    FOR EACH ROW
    WHEN (NEW.estado = 'completado' AND OLD.estado != 'completado')
EXECUTE FUNCTION update_inventory_on_purchase_completion();

CREATE TRIGGER purchase_completion_cash_trigger
    AFTER UPDATE
    ON purchases
    FOR EACH ROW
    WHEN (NEW.estado = 'completado' AND OLD.estado != 'completado')
EXECUTE FUNCTION register_cash_movement_on_purchase();

-- Triggers para ventas
CREATE TRIGGER sale_completion_inventory_trigger
    AFTER UPDATE
    ON sales
    FOR EACH ROW
    WHEN (NEW.estado = 'entregado' AND OLD.estado != 'entregado')
EXECUTE FUNCTION update_inventory_on_sale_completion();

CREATE TRIGGER sale_completion_cash_trigger
    AFTER UPDATE
    ON sales
    FOR EACH ROW
    WHEN (NEW.estado = 'entregado' AND OLD.estado != 'entregado')
EXECUTE FUNCTION register_cash_movement_on_sale();

-- Nota: Los triggers de producción ya están implementados en 00009_production.sql
