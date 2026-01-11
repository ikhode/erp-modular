import React, {useEffect, useState} from 'react';
import {Clock, Coffee, Filter, LogIn, LogOut, Search, UserCheck} from 'lucide-react';
import {attendanceStorage, empleadoStorage} from '../lib/storage';
import {Attendance, Empleado} from '../lib/db';

const TimeTracker: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedAction, setSelectedAction] = useState<Attendance['action']>('entrada');
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const actions = [
    { value: 'entrada' as Attendance['action'], label: 'Entrada', icon: LogIn, color: 'green' },
    { value: 'salida' as Attendance['action'], label: 'Salida', icon: LogOut, color: 'red' },
    { value: 'comida' as Attendance['action'], label: 'Salida a Comida', icon: Coffee, color: 'orange' },
    { value: 'regreso_comida' as Attendance['action'], label: 'Regreso de Comida', icon: Coffee, color: 'blue' },
    { value: 'baño' as Attendance['action'], label: 'Salida al Baño', icon: UserCheck, color: 'purple' },
    { value: 'regreso_baño' as Attendance['action'], label: 'Regreso del Baño', icon: UserCheck, color: 'indigo' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendancesData, empleadosData] = await Promise.all([
        attendanceStorage.getAll(),
        empleadoStorage.getAll()
      ]);
      setAttendances(
        attendancesData.map(a => ({
          ...a,
          timestamp: new Date(a.timestamp),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        }))
      );
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getEmpleado = (id: number) => empleados.find(e => e.id === id);

  const filteredLogs = attendances.filter(attendance => {
    const empleado = getEmpleado(attendance.employeeId);
    return empleado?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           attendance.action.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return bTime - aTime;
  });

  const getActiveEmployees = () => {
    const today = new Date().toDateString();
    const todayAttendances = attendances.filter(a => a.timestamp.toDateString() === today);

    return empleados.map(empleado => {
      const employeeAttendances = todayAttendances.filter(a => a.employeeId === empleado.id);
      const lastAttendance = employeeAttendances.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      let status = 'Ausente';
      let lastAction = 'Sin registros hoy';

      if (lastAttendance) {
        switch (lastAttendance.action) {
          case 'entrada':
            status = 'Trabajando';
            lastAction = `Entrada ${lastAttendance.timestamp.toLocaleTimeString()}`;
            break;
          case 'comida':
            status = 'En Comida';
            lastAction = `Salida a comida ${lastAttendance.timestamp.toLocaleTimeString()}`;
            break;
          case 'baño':
            status = 'En Baño';
            lastAction = `Salida al baño ${lastAttendance.timestamp.toLocaleTimeString()}`;
            break;
          case 'salida':
            status = 'Fuera';
            lastAction = `Salida ${lastAttendance.timestamp.toLocaleTimeString()}`;
            break;
          default:
            status = 'Trabajando';
            lastAction = `${lastAttendance.action} ${lastAttendance.timestamp.toLocaleTimeString()}`;
        }
      }

      return {
        id: empleado.id,
        name: empleado.nombre,
        status,
        lastAction
      };
    });
  };

  const handleClockAction = async () => {
    if (!employeeId) {
      alert('Por favor ingrese el ID del empleado');
      return;
    }

    const employeeIdNum = parseInt(employeeId);
    const empleado = getEmpleado(employeeIdNum);

    if (!empleado) {
      alert('Empleado no encontrado');
      return;
    }

    try {
      await attendanceStorage.add({
        employeeId: employeeIdNum,
        action: selectedAction,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      alert(`Registrado: ${selectedAction} para ${empleado.nombre} a las ${new Date().toLocaleTimeString()}`);
      setEmployeeId('');
      loadData();
    } catch (error) {
      console.error('Error registering attendance:', error);
      alert('Error al registrar la asistencia');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Trabajando': return 'bg-green-100 text-green-800';
      case 'En Comida': return 'bg-orange-100 text-orange-800';
      case 'Ausente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeEmployees = getActiveEmployees();

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
                onChange={(e) => setSelectedAction(e.target.value as Attendance['action'])}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{getEmpleado(log.employeeId)?.nombre}</div>
                      <div className="text-sm text-gray-500">ID: {log.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {log.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp.toLocaleDateString()}
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

