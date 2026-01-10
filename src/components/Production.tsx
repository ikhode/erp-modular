import React, {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Clock, Factory, Pause, Play, Target} from 'lucide-react';
import ProductionTicket from './ProductionTicket';
import {storage} from '../lib/storage';
import {Proceso, ProduccionTicket, Producto} from '../lib/db';

const Production: React.FC = () => {
  const [productionTickets, setProductionTickets] = useState<ProduccionTicket[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, procesosData, productosData] = await Promise.all([
        storage.produccion.getAll(),
        storage.procesos.getAll(),
        storage.productos.getAll(),
      ]);
      setProductionTickets(ticketsData);
      setProcesos(procesosData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error loading production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProducto = (id: number) => productos.find(p => p.id === id);
  const getProceso = (id: number) => procesos.find(p => p.id === id);

  // Adaptador para convertir Proceso (de storage) a Process (de ProductionTicket)
  type ProcessTicketItem = {
    productId?: string;
    productTypeId?: number;
    productName: string;
    productTypeName?: string;
    quantity: number;
    unit: string;
    allowedLocationTypes?: number[];
  };
  type ProcessTicketType = {
    id: string;
    name: string;
    description: string;
    inputs: ProcessTicketItem[];
    outputs: ProcessTicketItem[];
  };
  function procesoToProcess(p: Proceso): ProcessTicketType {
    const mapItem = (item: Partial<ProcessTicketItem>): ProcessTicketItem => ({
      productId: item.productId,
      productTypeId: item.productTypeId,
      productName: item.productName || '',
      productTypeName: item.productTypeName,
      quantity: 0, // default para ticket
      unit: item.unit || '',
      allowedLocationTypes: item.allowedLocationTypes || [],
    });
    return {
      id: String(p.id),
      name: p.nombre,
      description: p.descripcion || '',
      inputs: (p.inputs || []).map(mapItem),
      outputs: (p.outputs || []).map(mapItem),
    };
  }

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

  const totalEfficiency = productionTickets.reduce((sum, ticket) => {
    const proceso = getProceso(ticket.procesoId);
    return sum + (proceso ? proceso.efficiency : 0);
  }, 0) / productionTickets.length;

  const activeLines = productionTickets.filter(ticket => {
    const proceso = getProceso(ticket.procesoId);
    return proceso && proceso.status === 'running';
  }).length;

  const totalProduction = productionTickets.reduce((sum, ticket) => sum + ticket.completedQuantity, 0);

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
          const proceso = getProceso(ticket.procesoId);
          if (!proceso) return null;

          const StatusIcon = getStatusIcon(proceso.status);
          const progressPercentage = (ticket.completedQuantity / ticket.targetQuantity) * 100;

          return (
            <div key={ticket.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{proceso.nombre}</h3>
                  <p className="text-sm text-gray-600">{getProducto(ticket.productoId)?.nombre}</p>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proceso.status)}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {proceso.status === 'running' ? 'En Operación' :
                   proceso.status === 'stopped' ? 'Detenida' : 'Mantenimiento'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Lote Actual: {ticket.loteActual}</span>
                    <span>{ticket.completedQuantity}/{ticket.targetQuantity} unidades</span>
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
                      proceso.efficiency >= 80 ? 'text-green-600' : 
                      proceso.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {proceso.efficiency}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Hora de Inicio</p>
                    <p className="text-lg font-bold text-gray-900">{ticket.horaInicio}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimado de finalización:</span>
                    <span className="font-medium">{ticket.estimatedCompletion}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {proceso.status === 'running' ? (
                    <button className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center space-x-1">
                      <Pause className="h-4 w-4" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center space-x-1">
                      <Play className="h-4 w-4" />
                      <span>Iniciar</span>
                    </button>
                  )}
                  <button className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 transition-colors">
                    Detalles
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

      <div className="bg-white p-4 rounded shadow mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona un proceso</label>
        <select
          className="border rounded px-2 py-1"
          value={selectedProceso?.id || ''}
          onChange={e => {
            const p = procesos.find(pr => pr.id === Number(e.target.value));
            setSelectedProceso(p || null);
          }}
        >
          <option value="">-- Selecciona --</option>
          {procesos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>
      {selectedProceso && <ProductionTicket proceso={procesoToProcess(selectedProceso)} />}
    </div>
  );
};

export default Production;
