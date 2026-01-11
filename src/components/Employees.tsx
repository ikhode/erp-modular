import React, {useEffect, useState} from 'react';
import {CreditCard as Edit, Eye, Search, Trash2, UserPlus, Users} from 'lucide-react';
import {storage} from '../lib/storage';
import type {Empleado, ProduccionTicket} from '../lib/db';

const Employees: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmployee, setNewEmployee] = useState<Partial<Empleado>>({
    nombre: '',
    email: '',
    rol: '',
    telefono: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null);
  const [employeeTickets, setEmployeeTickets] = useState<(ProduccionTicket & { procesoNombre?: string; productoNombre?: string })[]>([]);
  const [showEmployeeHistory, setShowEmployeeHistory] = useState(false);

  // Refresca empleados cada vez que se cierra el modal de agregar/editar
  useEffect(() => {
    const fetchEmployees = async () => {
      const empleados = await storage.empleados.getAll();
      setEmployees(empleados);
    };
    fetchEmployees();
  }, [showAddModal, editingEmployee]);

  const filteredEmployees = employees.filter(employee =>
    (employee.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.rol || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOrEditEmployee = async () => {
    if (!newEmployee.nombre || !newEmployee.rol) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    if (editingEmployee) {
      await storage.empleados.update(editingEmployee.id!, {
        ...newEmployee,
        updatedAt: new Date(),
      });
      setEditingEmployee(null);
    } else {
      await storage.empleados.add({
        ...newEmployee,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Omit<Empleado, 'id'>);
    }
    setNewEmployee({ nombre: '', email: '', rol: '', telefono: '', createdAt: new Date(), updatedAt: new Date() });
    setShowAddModal(false);
  };

  const handleEdit = (employee: Empleado) => {
    setEditingEmployee(employee);
    setNewEmployee({
      nombre: employee.nombre,
      email: employee.email,
      rol: employee.rol,
      telefono: employee.telefono,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este empleado?')) {
      await storage.empleados.delete(id);
      const empleados = await storage.empleados.getAll();
      setEmployees(empleados);
    }
  };

  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [showNewRoleInput, setShowNewRoleInput] = useState(false);
  useEffect(() => {
    const fetchConfig = async () => {
      const rolesDb = await storage.userRoles.getAll();
      setRoles(rolesDb.map(r => r.name));
    };
    fetchConfig();
  }, [showNewRoleInput]);

  const handleShowHistory = async (employee: Empleado) => {
    setSelectedEmployee(employee);
    setShowEmployeeHistory(true);

    // Obtener tickets del empleado
    const tickets = await storage.produccionTickets.getAllByEmployeeId(employee.id!);

    // Obtener datos relacionados para cada ticket
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const proceso = await storage.procesos.getById(ticket.processId);
        const producto = await storage.productos.getById(ticket.productoTerminadoId);

        return {
          ...ticket,
          procesoNombre: proceso?.nombre || 'Proceso desconocido',
          productoNombre: producto?.nombre || 'Producto desconocido',
        };
      })
    );

    setEmployeeTickets(enrichedTickets as ProduccionTicket[]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold">{employees.filter(e => e.rol && e.rol !== 'inactivo').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Departamentos</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Presentes Hoy</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{employee.nombre}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                      <div className="text-xs text-gray-400">ID: {employee.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.rol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.telefono}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.rol && employee.rol !== 'inactivo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.rol && employee.rol !== 'inactivo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(employee.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" onClick={() => handleShowHistory(employee)}>
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de agregar/editar empleado */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newEmployee.nombre || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmployee.email || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={newEmployee.rol || ''}
                    onChange={e => {
                      if (e.target.value === '__nuevo__') {
                        setShowNewRoleInput(true);
                      } else {
                        setNewEmployee({ ...newEmployee, rol: e.target.value });
                        setShowNewRoleInput(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                    <option value="__nuevo__">+ Crear nuevo rol</option>
                  </select>
                  {showNewRoleInput && (
                    <input
                      type="text"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      placeholder="Nuevo rol"
                      className="w-32 px-2 py-1 border rounded"
                      onBlur={async () => {
                        if (newRole.trim()) {
                          await storage.userRoles.add({ name: newRole.trim(), createdAt: new Date(), updatedAt: new Date() });
                          setRoles(prev => [...prev, newRole.trim()]);
                          setNewEmployee({ ...newEmployee, rol: newRole.trim() });
                          setShowNewRoleInput(false);
                          setNewRole('');
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newEmployee.telefono || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddOrEditEmployee}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingEmployee ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setEditingEmployee(null); setNewEmployee({ nombre: '', email: '', rol: '', telefono: '', createdAt: new Date(), updatedAt: new Date() }); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial de tickets */}
      {showEmployeeHistory && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de Tickets - {selectedEmployee.nombre}
              </h3>
              <button
                onClick={() => setShowEmployeeHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabla de historial de tickets */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proceso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeeTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ticket.folio || `T-${ticket.id}`}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.procesoNombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.productoNombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.cantidadProducida} unidades
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.paymentAmount ? `$${ticket.paymentAmount}` : 'Pendiente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.estado === 'completado'
                              ? 'bg-green-100 text-green-800'
                              : ticket.estado === 'en_proceso'
                                ? 'bg-blue-100 text-blue-800'
                                : ticket.estado === 'pendiente'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}>
                            {ticket.estado === 'en_proceso' ? 'En Proceso' :
                             ticket.estado === 'completado' ? 'Completado' :
                             ticket.estado === 'pendiente' ? 'Pendiente' : 'Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

