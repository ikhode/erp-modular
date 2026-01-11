import {useCallback, useEffect, useState} from 'react';
import {Monitor, Smartphone, Users} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface RolePermission {
  permission_id: string;
  permissions: Permission;
}

export default function Permissions() {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [activeTab, setActiveTab] = useState<'roles' | 'terminals'>('roles');

  useEffect(() => {
     loadPermissions();
      loadRoles();
  }, []);

  const loadRolePermissions = useCallback(async () => {
    try {
      // Mock role permissions data for local development
      const mockRolePermissions = [
        { permission_id: 'prod_read', permissions: { id: 'prod_read', name: 'Ver Productos', description: 'Permite ver la lista de productos', resource: 'productos', action: 'read' } },
        { permission_id: 'prod_create', permissions: { id: 'prod_create', name: 'Crear Productos', description: 'Permite crear nuevos productos', resource: 'productos', action: 'create' } },
        { permission_id: 'ventas_read', permissions: { id: 'ventas_read', name: 'Ver Ventas', description: 'Permite ver las ventas realizadas', resource: 'ventas', action: 'read' } },
        { permission_id: 'compras_read', permissions: { id: 'compras_read', name: 'Ver Compras', description: 'Permite ver las compras realizadas', resource: 'compras', action: 'read' } },
        { permission_id: 'inv_read', permissions: { id: 'inv_read', name: 'Ver Inventario', description: 'Permite ver el estado del inventario', resource: 'inventario', action: 'read' } },
        { permission_id: 'prod_read', permissions: { id: 'prod_read', name: 'Ver Producción', description: 'Permite ver tickets de producción', resource: 'produccion', action: 'read' } },
        { permission_id: 'emp_read', permissions: { id: 'emp_read', name: 'Ver Empleados', description: 'Permite ver la lista de empleados', resource: 'empleados', action: 'read' } },
        { permission_id: 'rep_read', permissions: { id: 'rep_read', name: 'Ver Reportes', description: 'Permite acceder a reportes del sistema', resource: 'reportes', action: 'read' } },
        { permission_id: 'config_read', permissions: { id: 'config_read', name: 'Ver Configuración', description: 'Permite ver la configuración del sistema', resource: 'configuracion', action: 'read' } },
      ];

      // Filter permissions based on role
      let filteredPermissions = mockRolePermissions;
      if (selectedRole === 'operator') {
        filteredPermissions = mockRolePermissions.filter(p =>
          ['prod_read', 'inv_read'].includes(p.permission_id)
        );
      } else if (selectedRole === 'warehouse') {
        filteredPermissions = mockRolePermissions.filter(p =>
          ['prod_read', 'inv_read', 'inv_update'].includes(p.permission_id)
        );
      } else if (selectedRole === 'supervisor') {
        filteredPermissions = mockRolePermissions.filter(p =>
          !['config_update'].includes(p.permission_id)
        );
      }
      // Admin and manager get all permissions

      setRolePermissions(filteredPermissions);
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions();
    }
  }, [selectedRole, loadRolePermissions]);

  const loadPermissions = async () => {
    try {
      // Mock permissions data for local development
      const mockPermissions = {
        productos: [
          { id: 'prod_read', name: 'Ver Productos', description: 'Permite ver la lista de productos', resource: 'productos', action: 'read' },
          { id: 'prod_create', name: 'Crear Productos', description: 'Permite crear nuevos productos', resource: 'productos', action: 'create' },
          { id: 'prod_update', name: 'Editar Productos', description: 'Permite editar productos existentes', resource: 'productos', action: 'update' },
          { id: 'prod_delete', name: 'Eliminar Productos', description: 'Permite eliminar productos', resource: 'productos', action: 'delete' },
        ],
        ventas: [
          { id: 'ventas_read', name: 'Ver Ventas', description: 'Permite ver las ventas realizadas', resource: 'ventas', action: 'read' },
          { id: 'ventas_create', name: 'Crear Ventas', description: 'Permite registrar nuevas ventas', resource: 'ventas', action: 'create' },
          { id: 'ventas_update', name: 'Editar Ventas', description: 'Permite modificar ventas existentes', resource: 'ventas', action: 'update' },
        ],
        compras: [
          { id: 'compras_read', name: 'Ver Compras', description: 'Permite ver las compras realizadas', resource: 'compras', action: 'read' },
          { id: 'compras_create', name: 'Crear Compras', description: 'Permite registrar nuevas compras', resource: 'compras', action: 'create' },
          { id: 'compras_update', name: 'Editar Compras', description: 'Permite modificar compras existentes', resource: 'compras', action: 'update' },
        ],
        inventario: [
          { id: 'inv_read', name: 'Ver Inventario', description: 'Permite ver el estado del inventario', resource: 'inventario', action: 'read' },
          { id: 'inv_update', name: 'Actualizar Inventario', description: 'Permite modificar niveles de inventario', resource: 'inventario', action: 'update' },
        ],
        produccion: [
          { id: 'prod_read', name: 'Ver Producción', description: 'Permite ver tickets de producción', resource: 'produccion', action: 'read' },
          { id: 'prod_create', name: 'Crear Producción', description: 'Permite iniciar nuevos procesos de producción', resource: 'produccion', action: 'create' },
          { id: 'prod_update', name: 'Editar Producción', description: 'Permite modificar tickets de producción', resource: 'produccion', action: 'update' },
        ],
        empleados: [
          { id: 'emp_read', name: 'Ver Empleados', description: 'Permite ver la lista de empleados', resource: 'empleados', action: 'read' },
          { id: 'emp_create', name: 'Crear Empleados', description: 'Permite registrar nuevos empleados', resource: 'empleados', action: 'create' },
          { id: 'emp_update', name: 'Editar Empleados', description: 'Permite modificar datos de empleados', resource: 'empleados', action: 'update' },
        ],
        reportes: [
          { id: 'rep_read', name: 'Ver Reportes', description: 'Permite acceder a reportes del sistema', resource: 'reportes', action: 'read' },
          { id: 'rep_export', name: 'Exportar Reportes', description: 'Permite exportar reportes a archivos', resource: 'reportes', action: 'export' },
        ],
        configuracion: [
          { id: 'config_read', name: 'Ver Configuración', description: 'Permite ver la configuración del sistema', resource: 'configuracion', action: 'read' },
          { id: 'config_update', name: 'Editar Configuración', description: 'Permite modificar la configuración del sistema', resource: 'configuracion', action: 'update' },
        ]
      };

      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadRoles = async () => {
    try {
      // Mock roles data for local development
      const mockRoles = [
        { id: 'admin', name: 'Administrador', description: 'Acceso completo al sistema' },
        { id: 'manager', name: 'Gerente', description: 'Gestión de operaciones diarias' },
        { id: 'supervisor', name: 'Supervisor', description: 'Supervisión de producción' },
        { id: 'operator', name: 'Operador', description: 'Operaciones básicas de producción' },
        { id: 'accountant', name: 'Contador', description: 'Gestión financiera y reportes' },
        { id: 'warehouse', name: 'Almacén', description: 'Control de inventario y almacén' },
      ];
      setRoles(mockRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleRolePermissionChange = async () => {
    if (!selectedRole) return;

    // Mock update - just show success message
    alert('Permisos actualizados exitosamente (modo local)');
    loadRolePermissions();
  };

  const handleTerminalPermissionChange = async () => {
    // Mock update - just reload permissions
    // loadTerminalPermissions(_terminalType);
  };

  const isRolePermissionChecked = (permissionId: string) => {
    return rolePermissions.some(rp => rp.permission_id === permissionId);
  };

  const isTerminalPermissionAllowed = () => {
    // Mock implementation - always return true for now
    return true;
  };

  const getTerminalIcon = (type: string) => {
    switch (type) {
      case 'kiosko':
        return <Monitor className="h-5 w-5" />;
      case 'movil':
        return <Smartphone className="h-5 w-5" />;
      case 'escritorio':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h1>
          <p className="text-gray-600">Control de acceso y permisos del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Permisos por Rol
          </button>
          <button
            onClick={() => setActiveTab('terminals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'terminals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Monitor className="h-4 w-4 inline mr-2" />
            Restricciones por Terminal
          </button>
        </nav>
      </div>

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Selector de Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Rol
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar rol...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {selectedRole && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Permisos del Rol
                </h3>

                <div className="space-y-6">
                  {Object.entries(permissions).map(([resource, resourcePermissions]) => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3 capitalize">
                        {resource.replace('_', ' ')}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {resourcePermissions.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isRolePermissionChecked(permission.id)}
                              onChange={() => handleRolePermissionChange()}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {permission.action}
                              </span>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'terminals' && (
        <div className="space-y-6">
          {['kiosko', 'movil', 'escritorio'].map(terminalType => (
            <div key={terminalType} className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  {getTerminalIcon(terminalType)}
                  <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                    {terminalType}
                  </h3>
                </div>

                <div className="space-y-4">
                  {Object.entries(permissions).map(([resource, resourcePermissions]) => (
                    <div key={`${terminalType}-${resource}`} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3 capitalize">
                        {resource.replace('_', ' ')}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {resourcePermissions.map(permission => (
                          <label key={`${terminalType}-${permission.id}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isTerminalPermissionAllowed()}
                              onChange={() => handleTerminalPermissionChange()}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {permission.action}
                              </span>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
