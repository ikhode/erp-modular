import React, {useCallback, useEffect, useState} from 'react';
import {AlertCircle, Brain, Database, RefreshCw} from 'lucide-react';
import type {TimeSeriesData} from '../lib/mlService';
import {mlService} from '../lib/mlService';
import {storage} from '../lib/storage';

interface ModelStat {
  accuracy: number;
  trainingDataSize: number;
  lastTrained: string;
  version: string;
}

interface ModelStats {
  name: string;
  accuracy: number;
  trainingDataSize: number;
  lastTrained: Date;
  status: 'active' | 'training' | 'error';
  version: string;
}

interface ModelCardProps {
  model: ModelStats;
  index: number;
  trainingInProgress: string | null;
  onRetrain: (modelKey: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, index, trainingInProgress, onRetrain }) => {
  const [modelKey, setModelKey] = useState<string>('');

  useEffect(() => {
    const getModelKey = async () => {
      const stats = await mlService.getModelStats();
      const keys = Object.keys(stats);
      setModelKey(keys[index] || '');
    };
    getModelKey();
  }, [index]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'training': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">{model.name}</h4>
            <p className="text-sm text-gray-500">Versión {model.version}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
            trainingInProgress === modelKey ? 'training' : model.status
          )}`}>
            {trainingInProgress === modelKey ? 'Entrenando...' : 'Activo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getAccuracyColor(model.accuracy)}`}>
            {(model.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Precisión</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {model.trainingDataSize}
          </div>
          <div className="text-sm text-gray-600">Datos de Entrenamiento</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {model.lastTrained.toLocaleDateString('es-MX')}
          </div>
          <div className="text-sm text-gray-600">Último Entrenamiento</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Última actualización: {model.lastTrained.toLocaleTimeString('es-MX')}
          </div>
          <button
            onClick={() => onRetrain(modelKey)}
            disabled={trainingInProgress === modelKey}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {trainingInProgress === modelKey ? 'Mejorando...' : 'Mejorar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MLModelManager: React.FC = () => {
  const [models, setModels] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainingInProgress, setTrainingInProgress] = useState<string | null>(null);

  const loadModelStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await mlService.getModelStats();

      const modelStats: ModelStats[] = Object.entries(stats).map(([key, stat]: [string, ModelStat]) => ({
        name: formatModelName(key),
        accuracy: stat.accuracy,
        trainingDataSize: stat.trainingDataSize,
        lastTrained: new Date(stat.lastTrained),
        status: 'active',
        version: stat.version
      }));

      setModels(modelStats);
    } catch (error) {
      console.error('Error cargando estadísticas de modelos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModelStats();
  }, [loadModelStats]);

  const formatModelName = (key: string): string => {
    const names: Record<string, string> = {
      'SALES_PREDICTION': 'Predicción de Ventas',
      'PRODUCTION_EFFICIENCY': 'Eficiencia Productiva',
      'INVENTORY_OPTIMIZATION': 'Optimización de Inventario',
      'DEMAND_FORECASTING': 'Pronóstico de Demanda',
      'MAINTENANCE_PREDICTION': 'Predicción de Mantenimiento',
      'EMPLOYEE_PERFORMANCE': 'Rendimiento de Empleados',
      'ANOMALY_DETECTION': 'Detección de Anomalías'
    };
    return names[key] || key;
  };

  const retrainModel = async (modelKey: string) => {
    try {
      setTrainingInProgress(modelKey);

      // Obtener nuevos datos para entrenamiento
      const newData = await collectTrainingData(modelKey);

      if (newData.length > 0) {
        await mlService.retrainModel(modelKey, newData);

        // Actualizar estadísticas
        await loadModelStats();

        console.log(`Modelo ${modelKey} re-entrenado exitosamente`);
      }
    } catch (error) {
      console.error(`Error re-entrenando modelo ${modelKey}:`, error);
    } finally {
      setTrainingInProgress(null);
    }
  };

  const retrainAllModels = async () => {
    try {
      setTrainingInProgress('all');

      // Obtener todas las claves de modelos
      const stats = await mlService.getModelStats();
      const modelKeys = Object.keys(stats);

      // Re-entrenar cada modelo
      for (const modelKey of modelKeys) {
        try {
          const newData = await collectTrainingData(modelKey);
          if (newData.length > 0) {
            await mlService.retrainModel(modelKey, newData);
          }
        } catch (error) {
          console.error(`Error re-entrenando modelo ${modelKey}:`, error);
        }
      }

      // Actualizar estadísticas después de re-entrenar todos
      await loadModelStats();

      console.log('Todos los modelos re-entrenados exitosamente');
    } catch (error) {
      console.error('Error re-entrenando modelos:', error);
    } finally {
      setTrainingInProgress(null);
    }
  };

  const collectTrainingData = async (modelKey: string) => {
    // Recopilar datos recientes para re-entrenamiento
    const data: TimeSeriesData[] = [];

    try {
      switch (modelKey) {
        case 'SALES_PREDICTION': {
          const ventas = await storage.ventas.getAll();
          // Últimas 30 ventas para re-entrenamiento
          for (let i = Math.max(0, ventas.length - 30); i < ventas.length; i++) {
            const venta = ventas[i];
            data.push({
              timestamp: new Date(venta.createdAt),
              value: venta.cantidad * venta.precioUnitario
            });
          }
          break;
        }

        case 'PRODUCTION_EFFICIENCY': {
          const produccion = await storage.produccionTickets.getAll();
          for (let i = Math.max(0, produccion.length - 30); i < produccion.length; i++) {
            const ticket = produccion[i];
            data.push({
              timestamp: new Date(ticket.createdAt),
              value: ticket.estado === 'completado' ? 1 : 0,
              features: {
                cantidadProducida: ticket.cantidadProducida || 0,
                tiempoEstimado: ticket.tiempoEstimado || 0,
              }
            });
          }
          break;
        }

        case 'INVENTORY_OPTIMIZATION': {
          const inventario = await storage.inventario.getAll();
          for (let i = Math.max(0, inventario.length - 30); i < inventario.length; i++) {
            const item = inventario[i];
            data.push({
              timestamp: new Date(),
              value: item.cantidad,
              features: {
                productoId: item.productoId,
                ubicacionId: item.ubicacionId,
                minimo: item.minimo || 0
              }
            });
          }
          break;
        }

        case 'DEMAND_FORECASTING': {
          const ventas = await storage.ventas.getAll();
          for (let i = Math.max(0, ventas.length - 30); i < ventas.length; i++) {
            const venta = ventas[i];
            data.push({
              timestamp: new Date(venta.createdAt),
              value: venta.cantidad,
              features: {
                productoId: venta.productoId,
                precioUnitario: venta.precioUnitario
              }
            });
          }
          break;
        }

        case 'MAINTENANCE_PREDICTION': {
          // Simular datos de mantenimiento
          data.push({
            timestamp: new Date(),
            value: Math.random() * 10,
            features: {
              equipo: Math.floor(Math.random() * 5), // Convert to number
              horasOperacion: Math.random() * 1000
            }
          });
          break;
        }

        case 'EMPLOYEE_PERFORMANCE': {
          const empleados = await storage.empleados.getAll();
          const produccion = await storage.produccionTickets.getAll();
          for (const empleado of empleados.slice(0, 10)) {
            const ticketsEmpleado = produccion.filter(p => p.employeeId === empleado.id);
            const eficiencia = ticketsEmpleado.length > 0 ?
              ticketsEmpleado.filter(t => t.estado === 'completado').length / ticketsEmpleado.length : 0;
            data.push({
              timestamp: new Date(),
              value: eficiencia,
              features: {
                empleadoId: parseInt(empleado.id) || 0, // Convert to number
                rol: empleado.rol === 'admin' ? 1 : empleado.rol === 'supervisor' ? 2 : 0 // Convert to number
              }
            });
          }
          break;
        }

        case 'ANOMALY_DETECTION': {
          // Datos para detección de anomalías
          const ventas = await storage.ventas.getAll();
          const inventario = await storage.inventario.getAll();
          const produccion = await storage.produccionTickets.getAll();

          // Agregar datos de ventas recientes
          for (let i = Math.max(0, ventas.length - 10); i < ventas.length; i++) {
            const venta = ventas[i];
            data.push({
              timestamp: new Date(venta.createdAt),
              value: venta.cantidad * venta.precioUnitario,
              features: { type: 1 } // sales = 1
            });
          }

          // Agregar datos de producción
          for (let i = Math.max(0, produccion.length - 10); i < produccion.length; i++) {
            const ticket = produccion[i];
            data.push({
              timestamp: new Date(ticket.createdAt),
              value: ticket.cantidadProducida || 0,
              features: { type: 2 } // production = 2
            });
          }

          // Agregar datos de inventario
          for (let i = Math.max(0, inventario.length - 10); i < inventario.length; i++) {
            const item = inventario[i];
            data.push({
              timestamp: new Date(),
              value: item.cantidad,
              features: { type: 3 } // inventory = 3
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error recopilando datos de entrenamiento:', error);
    }

    return data;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Inteligencia Artificial
            </h3>
            <p className="text-sm text-gray-600">
              Modelos de aprendizaje automático para optimizar tu negocio
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={retrainAllModels}
            disabled={trainingInProgress !== null}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${trainingInProgress ? 'animate-spin' : ''}`} />
            <span>{trainingInProgress === 'all' ? 'Mejorando...' : 'Mejorar Modelos'}</span>
          </button>
          <button
            onClick={loadModelStats}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {models.map((model, index) => (
          <ModelCard
            key={index}
            model={model}
            index={index}
            trainingInProgress={trainingInProgress}
            onRetrain={retrainModel}
          />
        ))}
      </div>

      {/* Información del sistema */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
          Estado del Sistema
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Procesamiento:</span>
            <span className="ml-2 font-medium">Ultra rápido</span>
          </div>
          <div>
            <span className="text-gray-600">Almacenamiento:</span>
            <span className="ml-2 font-medium">Seguro y local</span>
          </div>
          <div>
            <span className="text-gray-600">Aprendizaje:</span>
            <span className="ml-2 font-medium">Continuo automático</span>
          </div>
          <div>
            <span className="text-gray-600">Modelos Activos:</span>
            <span className="ml-2 font-medium">{models.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
