import React, { useState } from 'react';
import { Monitor, Plus, CreditCard as Edit, Trash2, Search, Wifi, WifiOff } from 'lucide-react';

interface Terminal {
  id: string;
  name: string;
  type: 'cashier' | 'supervisor' | 'entrance' | 'mobile' | 'production';
  location: string;
  assignedEmployee?: string;
  status: 'online' | 'offline' | 'maintenance';
  ipAddress: string;
  lastSeen: string;
  permissions: string[];
  createdAt: string;
}

const Terminals: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([
    {
      id: '1',
      name: 'Caja Principal',
      type: 'cashier',
      location: 'Mostrador Principal',
      assignedEmployee: 'Ana Martínez',
      status: 'online',
      ipAddress: '192.168.1.100',
      lastSeen: '2024-01-15 14:30:00',
      permissions: ['sales', 'payments', 'receipts'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Terminal Supervisor',
      type: 'supervisor',
      location: 'Oficina',
      assignedEmployee: 'Carlos López',
      status: 'online',
      ipAddress: '192.168.1.101',
      lastSeen: '2024-01-15 14:25:00',
      permissions: ['reports', 'inventory', 'employees', 'production'],
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Control de Acceso',
      type: 'entrance',
      location: 'Entrada Principal',
      status: 'offline',
      ipAddress: '192.168.1.102',
      lastSeen: '2024-01-15 12:00:00',
      permissions: ['timetracker', 'faceauth'],
      createdAt: '2024-01-15'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const terminalTypes = [
    { value: 'cashier', label: 'Caja', description: 'Terminal para ventas y cobros' },
    { value: 'supervisor', label: 'Supervisor', description: 'Terminal administrativa' },
    { value: 'entrance', label: 'Entrada', description: 'Control de acceso y tiempo' },
    { value: 'mobile', label: 'Móvil', description: 'Dispositivo móvil' },
    { value: 'production', label: 'Producción', description: 'Terminal de planta' }
  ];

  const availablePermissions = [
    'sales', 'payments', 'receipts', 'reports', 'inventory', 
    'employees', 'production', 'timetracker', 'faceauth', 'purchases'
  ];

  const filteredTerminals = terminals.filter(terminal =>
    terminal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? Wifi : WifiOff;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      cashier: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-purple-100 text-purple-800',
      entrance: 'bg-green-100 text-green-800',
      mobile: 'bg-orange-100 text-orange-800',
      production: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta terminal?')) {
      setTerminals(terminals.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Terminales y Kioskos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Terminal</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Monitor className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Terminales</p>
              <p className="text-2xl font-bold">{terminals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Wifi className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">En Línea</p>
              <p className="text-2xl font-bold">{terminals.filter(t => t.status === 'online').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <WifiOff className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Fuera de Línea</p>
              <p className="text-2xl font-bold">{terminals.filter(t => t.status === 'offline').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Monitor className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Mantenimiento</p>
              <p className="text-2xl font-bold">{terminals.filter(t => t.status === 'maintenance').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar terminales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTerminals.map((terminal) => {
          const StatusIcon = getStatusIcon(terminal.status);
          return (
            <div key={terminal.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{terminal.name}</h3>
                    <p className="text-sm text-gray-500">{terminal.location}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(terminal)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(terminal.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(terminal.type)}`}>
                    {terminalTypes.find(t => t.value === terminal.type)?.label}
                  </span>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(terminal.status)}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {terminal.status === 'online' ? 'En Línea' : 
                     terminal.status === 'offline' ? 'Fuera de Línea' : 'Mantenimiento'}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>IP:</strong> {terminal.ipAddress}</p>
                  <p><strong>Última conexión:</strong> {terminal.lastSeen}</p>
                  {terminal.assignedEmployee && (
                    <p><strong>Asignado a:</strong> {terminal.assignedEmployee}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Permisos:</p>
                  <div className="flex flex-wrap gap-1">
                    {terminal.permissions.map((permission, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTerminal ? 'Editar Terminal' : 'Nueva Terminal'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidad completa del modal en desarrollo...
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingTerminal(null);
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Terminals;