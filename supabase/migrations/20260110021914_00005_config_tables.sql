-- Create flexible configuration tables for ERP customization
CREATE TABLE public.delivery_types
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    tenant_id   UUID                NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchase_types
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    tenant_id   UUID                NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expense_types
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    tenant_id   UUID                NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ticket_types
(
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(100) UNIQUE NOT NULL,
    description                 TEXT,
    is_payment_voucher          BOOLEAN     DEFAULT false,
    is_production_accreditation BOOLEAN     DEFAULT false,
    linked_processes            JSONB, -- Array of process IDs or names
    tenant_id                   UUID                NOT NULL,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.entity_states
(
    id          SERIAL PRIMARY KEY,
    entity_type VARCHAR(50)  NOT NULL, -- 'compras', 'ventas', 'produccion', etc.
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_default  BOOLEAN     DEFAULT false,
    sort_order  INTEGER     DEFAULT 0,
    tenant_id   UUID         NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entity_type, name, tenant_id)
);

-- Insert default values for coconut factory
INSERT INTO public.delivery_types (name, description, tenant_id)
VALUES ('cliente_recoge', 'El cliente recoge en fábrica', '00000000-0000-0000-0000-000000000000'),
       ('flete_propio', 'Envío con flete propio', '00000000-0000-0000-0000-000000000000'),
       ('flete_externo', 'Envío con flete externo', '00000000-0000-0000-0000-000000000000');

INSERT INTO public.purchase_types (name, description, tenant_id)
VALUES ('parcela', 'Compra en parcela', '00000000-0000-0000-0000-000000000000'),
       ('planta', 'Compra en planta', '00000000-0000-0000-0000-000000000000');

INSERT INTO public.expense_types (name, description, tenant_id)
VALUES ('nomina', 'Pago de nómina', '00000000-0000-0000-0000-000000000000'),
       ('mantenimiento', 'Gastos de mantenimiento', '00000000-0000-0000-0000-000000000000'),
       ('insumos', 'Compra de insumos', '00000000-0000-0000-0000-000000000000');

INSERT INTO public.ticket_types (name, description, is_payment_voucher, is_production_accreditation, linked_processes,
                                 tenant_id)
VALUES ('produccion', 'Ticket de producción', false, true, '[
  "destopado",
  "deshuesado",
  "pelado"
]', '00000000-0000-0000-0000-000000000000'),
       ('pago', 'Comprobante de pago', true, false, null, '00000000-0000-0000-0000-000000000000');

INSERT INTO public.entity_states (entity_type, name, description, is_default, sort_order, tenant_id)
VALUES ('compras', 'salida', 'Salida de compra', true, 1, '00000000-0000-0000-0000-000000000000'),
       ('compras', 'carga', 'Carga de producto', false, 2, '00000000-0000-0000-0000-000000000000'),
       ('compras', 'regreso', 'Regreso a fábrica', false, 3, '00000000-0000-0000-0000-000000000000'),
       ('compras', 'completado', 'Compra completada', false, 4, '00000000-0000-0000-0000-000000000000'),
       ('ventas', 'pendiente', 'Venta pendiente', true, 1, '00000000-0000-0000-0000-000000000000'),
       ('ventas', 'en_preparacion', 'En preparación', false, 2, '00000000-0000-0000-0000-000000000000'),
       ('ventas', 'en_transito', 'En tránsito', false, 3, '00000000-0000-0000-0000-000000000000'),
       ('ventas', 'entregado', 'Entregado', false, 4, '00000000-0000-0000-0000-000000000000'),
       ('produccion', 'pendiente', 'Ticket pendiente', true, 1, '00000000-0000-0000-0000-000000000000'),
       ('produccion', 'en_proceso', 'En proceso', false, 2, '00000000-0000-0000-0000-000000000000'),
       ('produccion', 'completado', 'Completado', false, 3, '00000000-0000-0000-0000-000000000000');

-- Add tenant_id columns to existing tables (if not already added)
-- Note: These ALTER TABLE will fail if columns already exist, but that's ok for migration

-- Enable RLS for new tables
ALTER TABLE public.delivery_types
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_types
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_states
    ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can access tenant config" ON public.delivery_types
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can access tenant config" ON public.purchase_types
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can access tenant config" ON public.expense_types
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can access tenant config" ON public.ticket_types
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can access tenant config" ON public.entity_states
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));
