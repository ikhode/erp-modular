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
