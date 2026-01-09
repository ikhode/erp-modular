import React, { useState } from 'react';
import { Search, Filter, Eye, Calendar, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  terminal: string;
  status: 'success' | 'failed' | 'warning';
}

const Audit: React.FC = () => {
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2024-01-15 14:30:25',
      userId: '001',
      userName: 'Juan Pérez',
      userRole: 'admin',
      action: 'LOGIN',
      module: 'Authentication',
      details: 'Inicio de sesión exitoso con Face ID',
      ipAddress: '192.168.1.100',
      terminal: 'Terminal Principal',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:25:10',
      userId: '002',
      userName: 'María García',
      userRole: 'cashier',
      action: 'SALE_CREATE',
      module: 'Sales',
      details: 'Venta creada por $450.00 - Ticket #12345',
      ipAddress: '192.168.1.101',
      terminal: 'Caja 1',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:20:15',
      userId: '003',
      userName: 'Carlos López',
      userRole: 'supervisor',
      action: 'INVENTORY_UPDATE',
      module: 'Inventory',
      details: 'Actualización de inventario - Producto: Coco Rallado 500g',
      ipAddress: '192.168.1.102',
      terminal: 'Terminal Supervisor',
      status: 'success'
    },
    {
      id: '4',
      timestamp: '2024-01-15 14:15:30',
      userId: '004',
      userName: 'Ana Martínez',
      userRole: 'employee',
      action: 'LOGIN_FAILED',
      module: 'Authentication',
      details: 'Intento de inicio de sesión fallido - Face ID no reconocido',
      ipAddress: '192.168.1.103',
      terminal: 'Control de Acceso',
      status: 'failed'
    },
    {
      id: '5',
      timestamp: '2024-01-15 14:10:45',
      userId: '001',
      userName: 'Juan Pérez',
      userRole: 'admin',
      action: 'PRODUCT_CREATE',
      module: 'Products',
      details: 'Producto creado: Aceite de Coco Premium 500ml',
      ipAddress: '192.168.1.100',
      terminal: 'Terminal Principal',
      status: 'success'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const modules = [
    'all', 'Authentication', 'Sales', 'Inventory', 'Products', 
    'Employees', 'Production', 'Purchases', 'Configuration'
  ];

  const statuses = [
    { value: 'all', label: 'Todos' },
    { value: 'success', label: 'Exitoso' },
    { value: 'failed', label: 'Fallido' },
    { value: 'warning', label: 'Advertencia' }
  ];

  const users = [
    'all', 'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez'
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesUser = selectedUser === 'all' || log.userName === selectedUser;
    
    return matchesSearch && matchesModule && matchesStatus && matchesUser;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return User;
    if (action.includes('CREATE') || action.includes('UPDATE') || action.includes('DELETE')) return Activity;
    return Eye;
  };

  const totalLogs = auditLogs.length;
  const successfulActions = auditLogs.filter(log => log.status === 'success').length;
  const failedActions = auditLogs.filter(log => log.status === 'failed').length;
  const uniqueUsers = new Set(auditLogs.map(log => log.userId)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría y Trazabilidad</h1>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Acciones</p>
              <p className="text-2xl font-bold">{totalLogs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Exitosas</p>
              <p className="text-2xl font-bold">{successfulActions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Fallidas</p>
              <p className="text-2xl font-bold">{failedActions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los módulos</option>
            {modules.slice(1).map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los usuarios</option>
            {users.slice(1).map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terminal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                        <div className="text-sm text-gray-500">{log.userRole} | {log.ipAddress}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ActionIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? 'Exitoso' :
                         log.status === 'failed' ? 'Fallido' : 'Advertencia'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.terminal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audit;