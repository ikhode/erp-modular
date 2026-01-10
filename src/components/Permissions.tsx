import React, {useEffect, useState} from 'react';
import {supabase} from '../../lib/supabase';
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

interface TerminalPermission {
  permission_id: string;
  allowed: boolean;
  permissions: Permission;
}

export default function Permissions() {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [terminalPermissions, setTerminalPermissions] = useState<Record<string, TerminalPermission[]>>({
    kiosko: [],
    movil: [],
    escritorio: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'terminals'>('roles');

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions();
    }
  }, [selectedRole]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('permissions/manage', {
        body: { action: 'get_all_permissions' }
      });

      if (error) throw error;

      if (data.success) {
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadRolePermissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('permissions/manage', {
        body: {
          action: 'get_role_permissions',
          permissionData: { roleId: selectedRole }
        }
      });

      if (error) throw error;

      if (data.success) {
        setRolePermissions(data.rolePermissions);
      }
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  };

  const loadTerminalPermissions = async (terminalType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('permissions/manage', {
        body: {
          action: 'get_terminal_permissions',
          permissionData: { terminalType }
        }
      });

      if (error) throw error;

      if (data.success) {
        setTerminalPermissions(prev => ({
          ...prev,
          [terminalType]: data.terminalPermissions
        }));
      }
    } catch (error) {
      console.error('Error loading terminal permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRolePermissionChange = async (permissionId: string, checked: boolean) => {
    if (!selectedRole) return;

    const currentPermissions = rolePermissions.map(rp => rp.permission_id);
    let newPermissions: string[];

    if (checked) {
      newPermissions = [...currentPermissions, permissionId];
    } else {
      newPermissions = currentPermissions.filter(id => id !== permissionId);
    }

    try {
      const { data, error } = await supabase.functions.invoke('permissions/manage', {
        body: {
          action: 'update_role_permissions',
          permissionData: {
            roleId: selectedRole,
            permissionIds: newPermissions
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        alert('Permisos actualizados exitosamente');
        loadRolePermissions();
      }
    } catch (error: unknown) {
      console.error('Error updating role permissions:', error);
      alert('Error al actualizar permisos: ' + (error as Error).message);
    }
  };

  const handleTerminalPermissionChange = async (terminalType: string, permissionId: string, allowed: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('permissions/manage', {
        body: {
          action: 'update_terminal_permissions',
          permissionData: {
            terminalType,
            permissionUpdates: [{ permissionId, allowed }]
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        loadTerminalPermissions(terminalType);
      }
    } catch (error: unknown) {
      console.error('Error updating terminal permissions:', error);
      alert('Error al actualizar permisos: ' + (error as Error).message);
    }
  };

  const isRolePermissionChecked = (permissionId: string) => {
    return rolePermissions.some(rp => rp.permission_id === permissionId);
  };

  const isTerminalPermissionAllowed = (terminalType: string, permissionId: string) => {
    const terminalPerms = terminalPermissions[terminalType];
    const perm = terminalPerms.find(tp => tp.permission_id === permissionId);
    return perm ? perm.allowed : true; // Por defecto true si no hay restricción
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                              onChange={(e) => handleRolePermissionChange(permission.id, e.target.checked)}
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
                              checked={isTerminalPermissionAllowed(terminalType, permission.id)}
                              onChange={(e) => handleTerminalPermissionChange(
                                terminalType,
                                permission.id,
                                e.target.checked
                              )}
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
