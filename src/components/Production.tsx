import React, { useState } from 'react';
import { Factory, Play, Pause, CheckCircle, AlertCircle, Clock, Target } from 'lucide-react';

interface ProductionLine {
  id: string;
  name: string;
  product: string;
  status: 'running' | 'stopped' | 'maintenance';
  currentBatch: string;
  targetQuantity: number;
  completedQuantity: number;
  efficiency: number;
  startTime: string;
  estimatedCompletion: string;
}

const Production: React.FC = () => {
  const [productionLines] = useState<ProductionLine[]>([
    {
      id: 'L001',
      name: 'Línea A - Rallado',
      product: 'Coco Rallado 500g',
      status: 'running',
      currentBatch: 'BATCH-240115-001',
      targetQuantity: 500,
      completedQuantity: 450,
      efficiency: 89,
      startTime: '08:00',
      estimatedCompletion: '16:30'
    },
    {
      id: 'L002',
      name: 'Línea B - Deshidratado',
      product: 'Coco Deshidratado 250g',
      status: 'running',
      currentBatch: 'BATCH-240115-002',
      targetQuantity: 300,
      completedQuantity: 180,
      efficiency: 76,
      startTime: '07:30',
      estimatedCompletion: '18:00'
    },
    {
      id: 'L003',
      name: 'Línea C - Aceite',
      product: 'Aceite de Coco 250ml',
      status: 'maintenance',
      currentBatch: 'BATCH-240115-003',
      targetQuantity: 200,
      completedQuantity: 0,
      efficiency: 0,
      startTime: '09:00',
      estimatedCompletion: '20:00'
    }
  ]);

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

  const totalEfficiency = productionLines.reduce((sum, line) => sum + line.efficiency, 0) / productionLines.length;
  const activeLines = productionLines.filter(line => line.status === 'running').length;
  const totalProduction = productionLines.reduce((sum, line) => sum + line.completedQuantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Producción</h1>
        <div className="text-sm text-gray-500">
          Turno: Matutino | Supervisor: Ana Rodríguez
        </div>
      </div>

      {/* Production Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Factory className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Líneas Activas</p>
              <p className="text-2xl font-bold">{activeLines}/{productionLines.length}</p>
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
        {productionLines.map((line) => {
          const StatusIcon = getStatusIcon(line.status);
          const progressPercentage = (line.completedQuantity / line.targetQuantity) * 100;
          
          return (
            <div key={line.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
                  <p className="text-sm text-gray-600">{line.product}</p>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(line.status)}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {line.status === 'running' ? 'En Operación' :
                   line.status === 'stopped' ? 'Detenida' : 'Mantenimiento'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Lote Actual: {line.currentBatch}</span>
                    <span>{line.completedQuantity}/{line.targetQuantity} unidades</span>
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
                      line.efficiency >= 80 ? 'text-green-600' : 
                      line.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {line.efficiency}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Hora de Inicio</p>
                    <p className="text-lg font-bold text-gray-900">{line.startTime}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimado de finalización:</span>
                    <span className="font-medium">{line.estimatedCompletion}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {line.status === 'running' ? (
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
    </div>
  );
};

export default Production;