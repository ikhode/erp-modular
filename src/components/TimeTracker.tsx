import React, { useState } from 'react';
import { Clock, LogIn, LogOut, Coffee, UserCheck, Search, Filter } from 'lucide-react';

const TimeTracker: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedAction, setSelectedAction] = useState('entrada');

  const actions = [
    { value: 'entrada', label: 'Entrada', icon: LogIn, color: 'green' },
    { value: 'salida', label: 'Salida', icon: LogOut, color: 'red' },
    { value: 'comida', label: 'Salida a Comida', icon: Coffee, color: 'orange' },
    { value: 'regreso_comida', label: 'Regreso de Comida', icon: Coffee, color: 'blue' },
    { value: 'baño', label: 'Salida al Baño', icon: UserCheck, color: 'purple' },
    { value: 'regreso_baño', label: 'Regreso del Baño', icon: UserCheck, color: 'indigo' },
  ];

  const recentLogs = [
    { id: 1, employeeId: '001', name: 'Juan Pérez', action: 'Entrada', time: '08:00:00', date: '2024-01-15' },
    { id: 2, employeeId: '002', name: 'María García', action: 'Salida a Comida', time: '12:00:00', date: '2024-01-15' },
    { id: 3, employeeId: '003', name: 'Carlos López', action: 'Entrada', time: '08:15:00', date: '2024-01-15' },
    { id: 4, employeeId: '001', name: 'Juan Pérez', action: 'Salida al Baño', time: '10:30:00', date: '2024-01-15' },
    { id: 5, employeeId: '002', name: 'María García', action: 'Regreso de Comida', time: '13:00:00', date: '2024-01-15' },
  ];

  const activeEmployees = [
    { id: '001', name: 'Juan Pérez', status: 'Trabajando', lastAction: 'Entrada 08:00' },
    { id: '002', name: 'María García', status: 'En Comida', lastAction: 'Salida a comida 12:00' },
    { id: '003', name: 'Carlos López', status: 'Trabajando', lastAction: 'Entrada 08:15' },
    { id: '004', name: 'Ana Martínez', status: 'Ausente', lastAction: 'Sin registros hoy' },
  ];

  const handleClockAction = () => {
    if (!employeeId) {
      alert('Por favor ingrese el ID del empleado');
      return;
    }
    
    const currentTime = new Date().toLocaleTimeString();
    alert(`Registrado: ${selectedAction} para empleado ${employeeId} a las ${currentTime}`);
    setEmployeeId('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Trabajando': return 'bg-green-100 text-green-800';
      case 'En Comida': return 'bg-orange-100 text-orange-800';
      case 'Ausente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reloj Checador</h1>
        <div className="text-lg font-mono bg-blue-100 px-4 py-2 rounded-lg">
          {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clock In/Out Terminal */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-blue-600" />
            Terminal de Registro
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del Empleado
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                placeholder="Ingrese ID del empleado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acción
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {actions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleClockAction}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <UserCheck className="h-5 w-5" />
              <span>Registrar</span>
            </button>
          </div>
        </div>

        {/* Active Employees Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-6 w-6 mr-2 text-green-600" />
            Estado de Empleados
          </h3>
          
          <div className="space-y-3">
            {activeEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">ID: {employee.id}</p>
                  <p className="text-xs text-gray-400">{employee.lastAction}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Registros Recientes</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.name}</div>
                      <div className="text-sm text-gray-500">ID: {log.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {log.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;