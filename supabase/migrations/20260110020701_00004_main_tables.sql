-- Create main ERP tables
CREATE TABLE public.clientes
(
    id           SERIAL PRIMARY KEY,
    nombre       TEXT NOT NULL,
    rfc          TEXT UNIQUE,
    email        TEXT,
    telefono     TEXT,
    direccion    TEXT,
    firma_base64 TEXT,
    tenant_id    UUID NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.proveedores
(
    id           SERIAL PRIMARY KEY,
    nombre       TEXT NOT NULL,
    rfc          TEXT UNIQUE,
    email        TEXT,
    telefono     TEXT,
    direccion    TEXT,
    firma_base64 TEXT,
    tenant_id    UUID NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.productos
(
    id            SERIAL PRIMARY KEY,
    nombre        TEXT           NOT NULL,
    descripcion   TEXT,
    precio_min    DECIMAL(10, 2) NOT NULL,
    precio_max    DECIMAL(10, 2) NOT NULL,
    precio_actual DECIMAL(10, 2) NOT NULL,
    unidad        TEXT           NOT NULL,
    tenant_id     UUID           NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_price_range CHECK (precio_min <= precio_max),
    CONSTRAINT valid_current_price CHECK (precio_actual BETWEEN precio_min AND precio_max)
);

CREATE TABLE public.ubicaciones
(
    id          SERIAL PRIMARY KEY,
    nombre      TEXT          NOT NULL,
    tipo        location_type NOT NULL,
    descripcion TEXT,
    tenant_id   UUID          NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.procesos
(
    id                 SERIAL PRIMARY KEY,
    nombre             TEXT         NOT NULL,
    descripcion        TEXT,
    ubicacion_id       INTEGER REFERENCES public.ubicaciones (id),
    requiere_face_auth BOOLEAN     DEFAULT false,
    tipo               process_type NOT NULL,
    tenant_id          UUID         NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.empleados
(
    id         SERIAL PRIMARY KEY,
    nombre     TEXT      NOT NULL,
    rol        user_role NOT NULL DEFAULT 'empleado',
    email      TEXT,
    telefono   TEXT,
    tenant_id  UUID      NOT NULL,
    created_at TIMESTAMPTZ        DEFAULT NOW(),
    updated_at TIMESTAMPTZ        DEFAULT NOW()
);

CREATE TABLE public.inventario
(
    id           SERIAL PRIMARY KEY,
    producto_id  INTEGER REFERENCES public.productos (id),
    ubicacion_id INTEGER REFERENCES public.ubicaciones (id),
    cantidad     DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tenant_id    UUID           NOT NULL,
    created_at   TIMESTAMPTZ             DEFAULT NOW(),
    updated_at   TIMESTAMPTZ             DEFAULT NOW()
);

CREATE TABLE public.produccion_tickets
(
    id                    SERIAL PRIMARY KEY,
    proceso_id            INTEGER REFERENCES public.procesos (id),
    empleado_id           INTEGER REFERENCES public.empleados (id),
    insumos               JSONB,
    producto_terminado_id INTEGER REFERENCES public.productos (id),
    cantidad_producida    DECIMAL(10, 2) NOT NULL,
    ubicacion_destino_id  INTEGER REFERENCES public.ubicaciones (id),
    firma_empleado_base64 TEXT,
    estado                TEXT           NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado')),
    tenant_id             UUID           NOT NULL,
    created_at            TIMESTAMPTZ             DEFAULT NOW(),
    updated_at            TIMESTAMPTZ             DEFAULT NOW()
);

CREATE TABLE public.compras
(
    id                     SERIAL PRIMARY KEY,
    proveedor_id           INTEGER REFERENCES public.proveedores (id),
    producto_id            INTEGER REFERENCES public.productos (id),
    cantidad               DECIMAL(10, 2) NOT NULL,
    precio_unitario        DECIMAL(10, 2) NOT NULL,
    tipo                   TEXT           NOT NULL CHECK (tipo IN ('parcela', 'planta')),
    vehiculo               TEXT,
    conductor              TEXT,
    firma_conductor_base64 TEXT,
    firma_encargado_base64 TEXT,
    firma_proveedor_base64 TEXT,
    estado                 TEXT           NOT NULL DEFAULT 'salida' CHECK (estado IN ('salida', 'carga', 'regreso', 'completado')),
    tenant_id              UUID           NOT NULL,
    created_at             TIMESTAMPTZ             DEFAULT NOW(),
    updated_at             TIMESTAMPTZ             DEFAULT NOW()
);

CREATE TABLE public.ventas
(
    id                     SERIAL PRIMARY KEY,
    cliente_id             INTEGER REFERENCES public.clientes (id),
    producto_id            INTEGER REFERENCES public.productos (id),
    cantidad               DECIMAL(10, 2) NOT NULL,
    precio_unitario        DECIMAL(10, 2) NOT NULL,
    tipo_entrega           TEXT           NOT NULL CHECK (tipo_entrega IN ('cliente_recoge', 'flete_propio', 'flete_externo')),
    vehiculo               TEXT,
    conductor              TEXT,
    firma_cliente_base64   TEXT,
    firma_conductor_base64 TEXT,
    estado                 TEXT           NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'en_transito', 'entregado')),
    tenant_id              UUID           NOT NULL,
    created_at             TIMESTAMPTZ             DEFAULT NOW(),
    updated_at             TIMESTAMPTZ             DEFAULT NOW()
);
