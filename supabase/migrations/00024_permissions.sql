-- Crear módulo de Permisos Granulares
-- Este módulo implementa control de acceso basado en roles y permisos específicos

-- Crear tabla de permisos
CREATE TABLE permissions
(
    id          UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource    VARCHAR(100)        NOT NULL, -- ej: 'clients', 'sales', 'inventory'
    action      VARCHAR(50)         NOT NULL, -- ej: 'read', 'create', 'update', 'delete', 'approve'
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos por rol
CREATE TABLE role_permissions
(
    id            UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (role_id, permission_id)
);

-- Crear tabla de permisos por terminal
CREATE TABLE terminal_permissions
(
    id            UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    terminal_type VARCHAR(50) NOT NULL CHECK (terminal_type IN ('kiosko', 'movil', 'escritorio')),
    permission_id UUID        NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    allowed       BOOLEAN                  DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (terminal_type, permission_id)
);

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION check_permission(user_id UUID, required_resource VARCHAR, required_action VARCHAR)
    RETURNS BOOLEAN AS
$$
DECLARE
    user_role_id   UUID;
    has_permission BOOLEAN := false;
BEGIN
    -- Obtener el rol del usuario
    SELECT role_id
    INTO user_role_id
    FROM users
    WHERE id = user_id;

    IF user_role_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar si el rol tiene el permiso requerido
    SELECT EXISTS(SELECT 1
                  FROM role_permissions rp
                           JOIN permissions p ON rp.permission_id = p.id
                  WHERE rp.role_id = user_role_id
                    AND p.resource = required_resource
                    AND p.action = required_action)
    INTO has_permission;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar permisos por terminal
CREATE OR REPLACE FUNCTION check_terminal_permission(
    user_id UUID,
    terminal_type VARCHAR,
    required_resource VARCHAR,
    required_action VARCHAR
)
    RETURNS BOOLEAN AS
$$
DECLARE
    has_base_permission BOOLEAN;
    terminal_allowed    BOOLEAN;
BEGIN
    -- Primero verificar permiso base del usuario
    has_base_permission := check_permission(user_id, required_resource, required_action);

    IF NOT has_base_permission THEN
        RETURN false;
    END IF;

    -- Verificar restricción por terminal
    SELECT allowed
    INTO terminal_allowed
    FROM terminal_permissions tp
             JOIN permissions p ON tp.permission_id = p.id
    WHERE tp.terminal_type = terminal_type
      AND p.resource = required_resource
      AND p.action = required_action;

    -- Si no hay restricción específica, permitir
    IF terminal_allowed IS NULL THEN
        RETURN true;
    END IF;

    RETURN terminal_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría
CREATE TRIGGER permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON permissions
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER role_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON role_permissions
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER terminal_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON terminal_permissions
    FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- Insertar permisos base del sistema
INSERT INTO permissions (name, description, resource, action)
VALUES
-- Clientes
('Ver Clientes', 'Puede ver la lista de clientes', 'clients', 'read'),
('Crear Clientes', 'Puede crear nuevos clientes', 'clients', 'create'),
('Editar Clientes', 'Puede editar información de clientes', 'clients', 'update'),
('Eliminar Clientes', 'Puede eliminar clientes', 'clients', 'delete'),

-- Proveedores
('Ver Proveedores', 'Puede ver la lista de proveedores', 'providers', 'read'),
('Crear Proveedores', 'Puede crear nuevos proveedores', 'providers', 'create'),
('Editar Proveedores', 'Puede editar información de proveedores', 'providers', 'update'),
('Eliminar Proveedores', 'Puede eliminar proveedores', 'providers', 'delete'),

-- Productos
('Ver Productos', 'Puede ver la lista de productos', 'products', 'read'),
('Crear Productos', 'Puede crear nuevos productos', 'products', 'create'),
('Editar Productos', 'Puede editar información de productos', 'products', 'update'),
('Eliminar Productos', 'Puede eliminar productos', 'products', 'delete'),

-- Inventario
('Ver Inventario', 'Puede ver el inventario', 'inventory', 'read'),
('Ajustar Inventario', 'Puede hacer ajustes manuales de inventario', 'inventory', 'update'),
('Traslados', 'Puede crear traslados entre ubicaciones', 'transfers', 'create'),

-- Compras
('Ver Compras', 'Puede ver las compras', 'purchases', 'read'),
('Crear Compras', 'Puede registrar nuevas compras', 'purchases', 'create'),
('Editar Compras', 'Puede editar compras', 'purchases', 'update'),
('Aprobar Compras', 'Puede aprobar compras', 'purchases', 'approve'),

-- Ventas
('Ver Ventas', 'Puede ver las ventas', 'sales', 'read'),
('Crear Ventas', 'Puede registrar nuevas ventas', 'sales', 'create'),
('Editar Ventas', 'Puede editar ventas', 'sales', 'update'),
('Aprobar Ventas', 'Puede aprobar ventas', 'sales', 'approve'),

-- Producción
('Ver Producción', 'Puede ver tickets de producción', 'production', 'read'),
('Crear Producción', 'Puede crear tickets de producción', 'production', 'create'),
('Editar Producción', 'Puede editar tickets de producción', 'production', 'update'),

-- Cuentas por Cobrar
('Ver CxC', 'Puede ver cuentas por cobrar', 'accounts_receivable', 'read'),
('Gestionar CxC', 'Puede gestionar pagos de cuentas por cobrar', 'accounts_receivable', 'update'),

-- Cuentas por Pagar
('Ver CxP', 'Puede ver cuentas por pagar', 'accounts_payable', 'read'),
('Gestionar CxP', 'Puede gestionar pagos de cuentas por pagar', 'accounts_payable', 'update'),

-- Caja
('Ver Caja', 'Puede ver movimientos de caja', 'cash_flow', 'read'),
('Registrar Movimientos', 'Puede registrar movimientos manuales de caja', 'cash_flow', 'create'),
('Arqueo de Caja', 'Puede realizar arqueo de caja', 'cash_flow', 'approve'),

-- Auditoría
('Ver Auditoría', 'Puede ver logs de auditoría', 'audit_logs', 'read'),

-- Configuración
('Configurar Sistema', 'Puede acceder a configuraciones del sistema', 'settings', 'update'),
('Gestionar Usuarios', 'Puede gestionar usuarios y roles', 'users', 'update'),
('Gestionar Permisos', 'Puede gestionar permisos del sistema', 'permissions', 'update');

-- Asignar permisos a roles iniciales
-- Owner: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         CROSS JOIN permissions p
WHERE r.name = 'owner';

-- Admin: la mayoría de permisos excepto configuración crítica
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.resource NOT IN ('permissions', 'settings')
WHERE r.name = 'admin';

-- Supervisor: permisos operativos principales
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.resource IN
                               ('clients', 'providers', 'products', 'inventory', 'purchases', 'sales', 'production',
                                'accounts_receivable', 'accounts_payable', 'cash_flow', 'audit_logs')
    AND p.action IN ('read', 'create', 'update')
WHERE r.name = 'supervisor';

-- Cajero: permisos de caja y ventas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.resource IN ('clients', 'sales', 'cash_flow', 'accounts_receivable')
WHERE r.name = 'cajero';

-- Empleado: permisos básicos de lectura y producción
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         JOIN permissions p ON p.resource IN ('products', 'inventory', 'production')
    AND p.action IN ('read', 'create')
WHERE r.name = 'empleado';

-- Configurar restricciones por terminal
-- Kiosko: solo operaciones básicas
INSERT INTO terminal_permissions (terminal_type, permission_id, allowed)
SELECT 'kiosko',
       p.id,
       CASE
           WHEN p.resource IN ('production', 'sales', 'purchases') AND p.action IN ('create', 'update') THEN true
           WHEN p.resource IN ('products', 'inventory', 'clients') AND p.action = 'read' THEN true
           ELSE false
           END
FROM permissions p;

-- Móvil: operaciones de campo
INSERT INTO terminal_permissions (terminal_type, permission_id, allowed)
SELECT 'movil',
       p.id,
       CASE
           WHEN p.resource IN ('sales', 'purchases', 'production', 'clients', 'providers') THEN true
           WHEN p.resource IN ('inventory', 'products') AND p.action = 'read' THEN true
           ELSE false
           END
FROM permissions p;

-- Escritorio: todas las operaciones
INSERT INTO terminal_permissions (terminal_type, permission_id, allowed)
SELECT 'escritorio', p.id, true
FROM permissions p;
