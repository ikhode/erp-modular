import React, {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Clock, Factory, Pause, Play, Plus, Target, UserCheck, X} from 'lucide-react';
import {folioGenerator, storage} from '../lib/storage';
import {Empleado, Proceso, ProduccionTicket, Producto} from '../lib/db';

const Production: React.FC = () => {
  const [productionTickets, setProductionTickets] = useState<ProduccionTicket[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'employee' | 'process' | 'inputs' | 'outputs'>('employee');
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null);
  const [ticketData, setTicketData] = useState({
    insumos: [] as { productId: number; ubicacionId: number; cantidad: number }[],
    productosGenerados: [] as { productId: number; ubicacionId: number; cantidad: number }[],
    empleadoId: 1, // Default employee
  });
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [editingTicket, setEditingTicket] = useState<ProduccionTicket | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<ProduccionTicket | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, procesosData, productosData, empleadosData] = await Promise.all([
        storage.produccionTickets.getAll(),
        storage.procesos.getAll(),
        storage.productos.getAll(),
        storage.empleados.getAll(),
      ]);
      // Normaliza los campos de fecha en los tickets
      setProductionTickets(
        ticketsData.map(ticket => ({
          ...ticket,
          startedAt: ticket.startedAt ? new Date(ticket.startedAt) : new Date(),
          completedAt: ticket.completedAt ? new Date(ticket.completedAt) : new Date(),
          paidAt: ticket.paidAt ? new Date(ticket.paidAt) : new Date(),
          createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
          updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date(),
        }))
      );
      setProcesos(procesosData);
      setProductos(productosData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error loading production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProducto = (id: number) => productos.find(p => p.id === id);
  const getProceso = (id: number) => procesos.find(p => p.id === id);

  // Function to update inventory when completing a ticket
  const updateInventoryForTicket = async (ticket: ProduccionTicket) => {
    try {
      // Decrease inventory for consumed products
      for (const insumo of ticket.insumos || []) {
        const currentInventory = await storage.inventario.where('[productId+ubicacionId]').equals([insumo.productId, insumo.ubicacionId]).first();
        if (currentInventory) {
          await storage.inventario.update(currentInventory.id, {
            cantidad: currentInventory.cantidad - insumo.cantidad,
            updatedAt: new Date()
          });
        }
      }

      // Increase inventory for produced products
      for (const output of ticket.productosGenerados || []) {
        const currentInventory = await storage.inventario.where('[productId+ubicacionId]').equals([output.productId, output.ubicacionId]).first();
        if (currentInventory) {
          await storage.inventario.update(currentInventory.id, {
            cantidad: currentInventory.cantidad + output.cantidad,
            updatedAt: new Date()
          });
        } else {
          // Create new inventory entry if it doesn't exist
          await storage.inventario.add({
            productId: output.productId,
            ubicacionId: output.ubicacionId,
            cantidad: output.cantidad,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  };

  // Function to start a ticket
  const startTicket = async (ticket: ProduccionTicket) => {
    try {
      await storage.produccionTickets.update(ticket.id, {
        estado: 'en_progreso',
        startedAt: new Date(),
        updatedAt: new Date()
      });
      loadData();
    } catch (error) {
      console.error('Error starting ticket:', error);
      alert('Error al iniciar el ticket');
    }
  };

  // Function to pause a ticket
  const pauseTicket = async (ticket: ProduccionTicket) => {
    try {
      await storage.produccionTickets.update(ticket.id, {
        estado: 'pendiente',
        updatedAt: new Date()
      });
      loadData();
    } catch (error) {
      console.error('Error pausing ticket:', error);
      alert('Error al pausar el ticket');
    }
  };

  // Function to complete a ticket
  const completeTicket = async (ticket: ProduccionTicket) => {
    try {
      // Update inventory first
      await updateInventoryForTicket(ticket);

      // Then update ticket status
      await storage.produccionTickets.update(ticket.id, {
        estado: 'completado',
        completedAt: new Date(),
        updatedAt: new Date()
      });
      loadData();
    } catch (error) {
      console.error('Error completing ticket:', error);
      alert('Error al completar el ticket');
    }
  };

  // Function to cancel a ticket
  const cancelTicket = async (ticket: ProduccionTicket) => {
    try {
      await storage.produccionTickets.update(ticket.id, {
        estado: 'cancelado',
        updatedAt: new Date()
      });
      loadData();
    } catch (error) {
      console.error('Error canceling ticket:', error);
      alert('Error al cancelar el ticket');
    }
  };

  // Function to edit a ticket
  const editTicket = (ticket: ProduccionTicket) => {
    setEditingTicket(ticket);
  };

  // Function to delete a ticket
  const deleteTicket = (ticket: ProduccionTicket) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Play;
      case 'stopped': return Pause;
      case 'maintenance': return AlertCircle;
      default: return Clock;
    }
  };

  const totalEfficiency = productionTickets.length > 0 ? productionTickets.reduce((sum, ticket) => {
    const proceso = getProceso(ticket.processId);
    return sum + (proceso ? 85 : 0); // Default efficiency
  }, 0) / productionTickets.length : 0;

  const activeLines = productionTickets.filter(ticket => {
    const proceso = getProceso(ticket.processId);
    return proceso && ticket.estado === 'en_proceso';
  }).length;

  const totalProduction = productionTickets.reduce((sum, ticket) => sum + (ticket.cantidadProducida || 0), 0);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Producción</h1>
      </div>

      {/* Production Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Factory className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Líneas Activas</p>
              <p className="text-2xl font-bold">{activeLines}/{productionTickets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Eficiencia Promedio</p>
              <p className="text-2xl font-bold">{Math.round(totalEfficiency)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Producción Hoy</p>
              <p className="text-2xl font-bold">{totalProduction}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Tiempo Operación</p>
              <p className="text-2xl font-bold">8.5h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Lines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {productionTickets.map((ticket) => {
          const proceso = getProceso(ticket.processId);
          if (!proceso) return null;

          const status = ticket.estado === 'en_proceso' ? 'running' : ticket.estado === 'completado' ? 'stopped' : 'maintenance';
          const StatusIcon = getStatusIcon(status);
          const progressPercentage = (ticket.cantidadProducida / 100) * 100; // Assuming target is 100 for now
          const eficiencia = 85; // TODO: calcular eficiencia real si aplica

          return (
            <div key={ticket.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{proceso.nombre}</h3>
                  <p className="text-sm text-gray-600">{getProducto(ticket.productoTerminadoId)?.nombre}</p>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {status === 'running' ? 'En Operación' :
                   status === 'stopped' ? 'Detenida' : 'Mantenimiento'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Lote Actual: {ticket.folio || 'N/A'}</span>
                    <span>{ticket.cantidadProducida}/100 unidades</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {Math.round(progressPercentage)}% completado
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Eficiencia</p>
                    <p className={`text-lg font-bold ${
                      eficiencia >= 80 ? 'text-green-600' : 
                      eficiencia >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {eficiencia}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pago</p>
                    <p className={`text-lg font-bold ${
                      ticket.paidAt && ticket.paymentAmount ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ticket.paidAt && ticket.paymentAmount ? `$${ticket.paymentAmount}` : 'Pendiente'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimado de finalización:</span>
                    <span className="font-medium">
                      {ticket.completedAt ? new Date(ticket.completedAt).toLocaleTimeString() : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {ticket.estado === 'en_progreso' ? (
                    <button
                      onClick={() => pauseTicket(ticket)}
                      className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pausar</span>
                    </button>
                  ) : ticket.estado === 'pendiente' ? (
                    <button
                      onClick={() => startTicket(ticket)}
                      className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Play className="h-4 w-4" />
                      <span>Iniciar</span>
                    </button>
                  ) : ticket.estado === 'completado' ? (
                    <button
                      onClick={() => cancelTicket(ticket)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => completeTicket(ticket)}
                      className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Completar</span>
                    </button>
                  )}
                  <button
                    onClick={() => editTicket(ticket)}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteTicket(ticket)}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Programación de Producción</h3>
        
        <div className="space-y-3">
          {[
            { time: '06:00 - 14:00', shift: 'Turno Matutino', lines: 'Líneas A, B, C', supervisor: 'Ana Rodríguez' },
            { time: '14:00 - 22:00', shift: 'Turno Vespertino', lines: 'Líneas A, B', supervisor: 'Carlos Mendoza' },
            { time: '22:00 - 06:00', shift: 'Turno Nocturno', lines: 'Línea A (mantenimiento)', supervisor: 'Luis Torres' },
          ].map((schedule, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="font-mono text-sm text-gray-600">{schedule.time}</div>
                  <div className="font-medium text-gray-900">{schedule.shift}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {schedule.lines} | Supervisor: {schedule.supervisor}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {index === 0 ? 'Activo' : 'Programado'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Ticket Button */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nuevo Ticket de Producción</h3>
            <p className="text-sm text-gray-600">Crear un nuevo ticket de producción rápidamente</p>
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setModalStep('employee');
              setSelectedProceso(null);
              setSelectedEmployee(null);
              setEmployeeSearchTerm('');
              setTicketData({
                insumos: [],
                productosGenerados: [],
                empleadoId: 1,
              });
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Nuevo Ticket de Producción
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    modalStep === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-12 h-1 ${
                    modalStep === 'process' || modalStep === 'inputs' || modalStep === 'outputs' ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    modalStep === 'process' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div className={`w-12 h-1 ${
                    modalStep === 'inputs' || modalStep === 'outputs' ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    modalStep === 'inputs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div className={`w-12 h-1 ${
                    modalStep === 'outputs' ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    modalStep === 'outputs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    4
                  </div>
                </div>
              </div>

              {/* Step Content */}
              {modalStep === 'employee' && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Seleccionar Empleado</h4>
                  <p className="text-sm text-gray-600">Elige el empleado asignado a este ticket</p>

                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o alias..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {empleados
                      .filter(empleado =>
                        (empleado.nombre || '').toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                        (empleado.alias || '').toLowerCase().includes(employeeSearchTerm.toLowerCase())
                      )
                      .map(empleado => (
                        <button
                          key={empleado.id}
                          onClick={() => {
                            setSelectedEmployee(empleado);
                            setTicketData(prev => ({ ...prev, empleadoId: empleado.id! }));
                            setModalStep('process');
                          }}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedEmployee?.id === empleado.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {empleado.faceImageBase64 ? (
                                <img
                                  src={empleado.faceImageBase64}
                                  alt={empleado.nombre}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {empleado.nombre.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{empleado.nombre}</h5>
                              {empleado.alias && (
                                <p className="text-sm text-blue-600">Alias: {empleado.alias}</p>
                              )}
                              <p className="text-sm text-gray-600">{empleado.rol}</p>
                            </div>
                            {empleado.faceId && (
                              <div className="flex-shrink-0">
                                <div className="flex items-center text-green-600">
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Face ID</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {modalStep === 'process' && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Seleccionar Proceso</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {procesos.map(proceso => (
                      <button
                        key={proceso.id}
                        onClick={() => {
                          setSelectedProceso(proceso);
                          setModalStep('inputs');
                          // Initialize insumos based on proceso inputs
                          const insumos = (proceso.inputs || []).map(input => ({
                            productId: input.productId ? parseInt(input.productId) : 0,
                            ubicacionId: 0,
                            cantidad: 1, // Default quantity
                          }));
                          setTicketData(prev => ({ ...prev, insumos }));
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedProceso?.id === proceso.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <h5 className="font-medium text-gray-900">{proceso.nombre}</h5>
                        <p className="text-sm text-gray-600 mt-1">{proceso.descripcion}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {proceso.inputs?.length || 0} insumos → {proceso.outputs?.length || 0} productos
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalStep === 'inputs' && selectedProceso && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Configurar Insumos</h4>
                  <p className="text-sm text-gray-600">Selecciona qué productos consumir y de dónde</p>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(selectedProceso.inputs || []).map((input, index) => {
                      const availableProducts = productos.filter(p =>
                        !input.productId || p.id === parseInt(input.productId)
                      );

                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">{input.productName}</h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Producto
                              </label>
                              <select
                                value={ticketData.insumos[index]?.productId || ''}
                                onChange={(e) => {
                                  const newInsumos = [...ticketData.insumos];
                                  newInsumos[index] = {
                                    ...newInsumos[index],
                                    productId: parseInt(e.target.value),
                                    ubicacionId: 0, // Reset location when product changes
                                  };
                                  setTicketData(prev => ({ ...prev, insumos: newInsumos }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Seleccionar producto</option>
                                {availableProducts.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad ({input.unit})
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={ticketData.insumos[index]?.cantidad || 1}
                                onChange={(e) => {
                                  const newInsumos = [...ticketData.insumos];
                                  newInsumos[index] = {
                                    ...newInsumos[index],
                                    cantidad: parseInt(e.target.value) || 1,
                                  };
                                  setTicketData(prev => ({ ...prev, insumos: newInsumos }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {modalStep === 'outputs' && selectedProceso && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Configurar Productos Generados</h4>
                  <p className="text-sm text-gray-600">Define dónde almacenar los productos producidos</p>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(selectedProceso.outputs || []).map((output, index) => {
                      const availableProducts = productos.filter(p =>
                        !output.productId || p.id === parseInt(output.productId)
                      );

                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">{output.productName}</h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Producto
                              </label>
                              <select
                                value={ticketData.productosGenerados[index]?.productId || ''}
                                onChange={(e) => {
                                  const newProductos = [...ticketData.productosGenerados];
                                  newProductos[index] = {
                                    ...newProductos[index],
                                    productId: parseInt(e.target.value),
                                    ubicacionId: 0,
                                  };
                                  setTicketData(prev => ({ ...prev, productosGenerados: newProductos }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Seleccionar producto</option>
                                {availableProducts.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Estimada ({output.unit})
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={ticketData.productosGenerados[index]?.cantidad || 1}
                                onChange={(e) => {
                                  const newProductos = [...ticketData.productosGenerados];
                                  newProductos[index] = {
                                    ...newProductos[index],
                                    cantidad: parseInt(e.target.value) || 1,
                                  };
                                  setTicketData(prev => ({ ...prev, productosGenerados: newProductos }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  if (modalStep === 'inputs') {
                    setModalStep('process');
                  } else if (modalStep === 'outputs') {
                    setModalStep('inputs');
                  } else if (modalStep === 'process') {
                    setModalStep('employee');
                  }
                }}
                disabled={modalStep === 'employee'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>

                {modalStep === 'outputs' ? (
                  <button
                    onClick={async () => {
                      // Create the ticket
                      try {
                        const folio = await folioGenerator.generateFolio('PROD');
                        const newTicket: ProduccionTicket = {
                          folio,
                          processId: selectedProceso!.id!,
                          employeeId: ticketData.empleadoId,
                          insumos: ticketData.insumos,
                          productoTerminadoId: ticketData.productosGenerados[0]?.productId || 0,
                          cantidadProducida: ticketData.productosGenerados[0]?.cantidad || 0,
                          ubicacionDestinoId: ticketData.productosGenerados[0]?.ubicacionId || 0,
                          estado: 'pendiente',
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        };

                        await storage.produccionTickets.add(newTicket);
                        setShowModal(false);
                        loadData(); // Refresh data
                      } catch (error) {
                        console.error('Error creating ticket:', error);
                        alert('Error al crear el ticket');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Crear Ticket
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (modalStep === 'process' && selectedProceso) {
                        setModalStep('inputs');
                      } else if (modalStep === 'inputs') {
                        setModalStep('outputs');
                        // Initialize productosGenerados based on proceso outputs
                        const productosGenerados = (selectedProceso?.outputs || []).map(output => ({
                          productId: output.productId ? parseInt(output.productId) : 0,
                          ubicacionId: 0,
                          cantidad: 1, // Default quantity
                        }));
                        setTicketData(prev => ({ ...prev, productosGenerados }));
                      }
                    }}
                    disabled={modalStep === 'process' && !selectedProceso}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {modalStep === 'inputs' ? 'Siguiente' : 'Continuar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit and Delete Ticket Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Ticket de Producción
              </h3>
              <button
                onClick={() => setEditingTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Ticket Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proceso
                  </label>
                  <select
                    value={editingTicket.processId}
                    onChange={(e) => {
                      const procesoId = parseInt(e.target.value);
                      const proceso = getProceso(procesoId);
                      setEditingTicket(prev => ({
                        ...prev!,
                        processId: procesoId,
                        productoTerminadoId: proceso?.outputs?.[0]?.productId || 0,
                        cantidadProducida: proceso?.outputs?.[0]?.cantidad || 0,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar proceso</option>
                    {procesos.map(proceso => (
                      <option key={proceso.id} value={proceso.id}>
                        {proceso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empleado
                  </label>
                  <select
                    value={editingTicket.employeeId}
                    onChange={(e) => setEditingTicket(prev => ({ ...prev!, employeeId: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {empleados.map(empleado => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insumos
                  </label>
                  <div className="space-y-2">
                    {(editingTicket.insumos || []).map((insumo, index) => {
                      const producto = getProducto(insumo.productId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{producto?.nombre}</p>
                            <p className="text-xs text-gray-600">
                              Ubicación: {insumo.ubicacionId} | Cantidad: {insumo.cantidad}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newInsumos = editingTicket.insumos.filter((_, i) => i !== index);
                              setEditingTicket(prev => ({ ...prev!, insumos: newInsumos }));
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Productos Generados
                  </label>
                  <div className="space-y-2">
                    {(editingTicket.productosGenerados || []).map((output, index) => {
                      const producto = getProducto(output.productId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{producto?.nombre}</p>
                            <p className="text-xs text-gray-600">
                              Ubicación: {output.ubicacionId} | Cantidad Estimada: {output.cantidad}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newOutputs = editingTicket.productosGenerados.filter((_, i) => i !== index);
                              setEditingTicket(prev => ({ ...prev!, productosGenerados: newOutputs }));
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Save changes
                      storage.produccionTickets.update(editingTicket.id, editingTicket);
                      setEditingTicket(null);
                      loadData();
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Guardar Cambios</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Eliminar Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ticket Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Eliminar Ticket de Producción</h3>
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar el ticket <strong>{ticketToDelete.folio}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  // Eliminar el ticket
                  await storage.produccionTickets.delete(ticketToDelete.id);
                  setShowDeleteModal(false);
                  setTicketToDelete(null);
                  loadData();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
