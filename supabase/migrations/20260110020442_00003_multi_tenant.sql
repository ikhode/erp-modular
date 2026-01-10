-- Create profiles table for user metadata
CREATE TABLE public.profiles
(
    id         UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    tenant_id  UUID        NOT NULL DEFAULT gen_random_uuid(),
    role       user_role   NOT NULL DEFAULT 'owner',
    nombre     TEXT,
    apellido   TEXT,
    telefono   TEXT,
    activo     BOOLEAN              DEFAULT true,
    created_at TIMESTAMPTZ          DEFAULT NOW(),
    updated_at TIMESTAMPTZ          DEFAULT NOW()
);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS
$$
BEGIN
    INSERT INTO public.profiles (id, email, tenant_id, role)
    VALUES (NEW.id, NEW.email, gen_random_uuid(), 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for tenant_id (columns already exist)
CREATE INDEX idx_clientes_tenant_id ON public.clientes (tenant_id);
CREATE INDEX idx_proveedores_tenant_id ON public.proveedores (tenant_id);
CREATE INDEX idx_productos_tenant_id ON public.productos (tenant_id);
CREATE INDEX idx_empleados_tenant_id ON public.empleados (tenant_id);
CREATE INDEX idx_ubicaciones_tenant_id ON public.ubicaciones (tenant_id);
CREATE INDEX idx_procesos_tenant_id ON public.procesos (tenant_id);
CREATE INDEX idx_inventario_tenant_id ON public.inventario (tenant_id);
CREATE INDEX idx_produccion_tickets_tenant_id ON public.produccion_tickets (tenant_id);
CREATE INDEX idx_compras_tenant_id ON public.compras (tenant_id);
CREATE INDEX idx_ventas_tenant_id ON public.ventas (tenant_id);

-- Enable RLS
ALTER TABLE public.profiles
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procesos
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_tickets
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas
    ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their tenant's data
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view tenant data" ON public.clientes
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.proveedores
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.productos
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.empleados
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.ubicaciones
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.procesos
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.inventario
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.produccion_tickets
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.compras
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant data" ON public.ventas
    FOR ALL USING (tenant_id IN (SELECT tenant_id
                                 FROM public.profiles
                                 WHERE id = auth.uid()));
