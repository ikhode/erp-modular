-- Create extended users table
CREATE TABLE public.users
(
    id         UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    role       user_role   NOT NULL DEFAULT 'empleado',
    nombre     TEXT,
    apellido   TEXT,
    telefono   TEXT,
    activo     BOOLEAN              DEFAULT true,
    created_at TIMESTAMPTZ          DEFAULT NOW(),
    updated_at TIMESTAMPTZ          DEFAULT NOW()
);

