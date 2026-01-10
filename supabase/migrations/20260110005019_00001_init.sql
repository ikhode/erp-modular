-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create configuration tables instead of ENUMs for SaaS flexibility
CREATE TABLE user_roles
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE location_types
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE process_types
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values
INSERT INTO user_roles (name, description)
VALUES ('owner', 'Propietario del sistema'),
       ('admin', 'Administrador'),
       ('supervisor', 'Supervisor'),
       ('cajero', 'Cajero'),
       ('empleado', 'Empleado');

INSERT INTO location_types (name, description)
VALUES ('patio', 'Área externa de patio'),
       ('bodega', 'Almacén interno'),
       ('tanque', 'Depósito de líquidos');

INSERT INTO process_types (name, description)
VALUES ('destopado', 'Proceso de destopado'),
       ('deshuesado', 'Proceso de deshuesado'),
       ('pelado', 'Proceso de pelado'),
       ('pagos', 'Gestión de pagos');

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'supervisor', 'cajero', 'empleado');
CREATE TYPE location_type AS ENUM ('patio', 'bodega', 'tanque');
CREATE TYPE process_type AS ENUM ('destopado', 'deshuesado', 'pelado', 'pagos');

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
