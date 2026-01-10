-- Inicialización del Sistema ERP
-- Extensiones y tipos básicos

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos ENUM para el sistema
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'supervisor', 'cashier', 'employee');
CREATE TYPE location_type AS ENUM ('patio', 'bodega', 'tanque', 'oficina', 'taller');
CREATE TYPE process_type AS ENUM ('produccion', 'mantenimiento', 'calidad', 'empaque');
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste', 'transferencia');
CREATE TYPE transfer_status AS ENUM ('pendiente', 'en_transito', 'completado', 'cancelado');
CREATE TYPE purchase_status AS ENUM ('borrador', 'solicitado', 'aprobado', 'en_transito', 'recibido', 'cancelado');
CREATE TYPE sale_status AS ENUM ('borrador', 'confirmado', 'preparando', 'listo', 'enviado', 'entregado', 'cancelado');
CREATE TYPE production_status AS ENUM ('pendiente', 'en_proceso', 'completado', 'cancelado');
CREATE TYPE payment_status AS ENUM ('pendiente', 'parcial', 'pagado', 'vencido');

-- Función auxiliar para generar códigos únicos
CREATE OR REPLACE FUNCTION generate_code(prefix TEXT, sequence_name TEXT)
    RETURNS TEXT AS
$$
DECLARE
    next_val INTEGER;
    code     TEXT;
BEGIN
    -- Obtener el siguiente valor de la secuencia
    EXECUTE format('SELECT nextval(''%I'')', sequence_name) INTO next_val;

    -- Generar código con formato: PREFIJO + YYYY + valor rellenado
    code := prefix || to_char(CURRENT_DATE, 'YYYY') || lpad(next_val::TEXT, 6, '0');

    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Función para validar RFC mexicano
CREATE OR REPLACE FUNCTION validate_rfc(rfc TEXT)
    RETURNS BOOLEAN AS
$$
BEGIN
    -- Validación básica de RFC mexicano (13 o 12 caracteres)
    IF length(rfc) NOT IN (12, 13) THEN
        RETURN false;
    END IF;

    -- El RFC debe contener solo letras mayúsculas, números y algunos caracteres especiales
    IF rfc !~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$' THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular días de vencimiento
CREATE OR REPLACE FUNCTION calculate_overdue_days(due_date DATE)
    RETURNS INTEGER AS
$$
BEGIN
    RETURN GREATEST(0, CURRENT_DATE - due_date);
END;
$$ LANGUAGE plpgsql;

-- Configuración de timezone
SET timezone = 'America/Mexico_City';
