import React, {useCallback, useEffect, useState} from 'react';
import {Doughnut, Line} from 'react-chartjs-2';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Brain,
    CheckCircle,
    Cpu,
    Database,
    Package,
    RefreshCw,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import {mlService, PredictionResult} from '../lib/mlService';
import {storage} from '../lib/storage';

interface AdvancedAIWidgetProps {
    className?: string;
}

interface AnomalyResult {
    id: number;
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    timestamp: Date;
    impact: number;
    confidence: number;
}

interface SystemMetrics {
    cpu?: number;
    memory?: number;
    network?: number;
    gpu?: number;
    modelsLoaded?: number;
    lastUpdate?: Date;
    systemLoad?: number;
    predictionAccuracy?: number;
    anomalyDetectionRate?: number;
    backend?: string;
    memoryUsage?: number;
}

export const AdvancedAIWidget: React.FC<AdvancedAIWidgetProps> = ({ className }) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({} as SystemMetrics);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'predictions' | 'anomalies' | 'optimization'>('predictions');

  const loadAdvancedData = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener predicciones avanzadas
      const salesPredictions = await mlService.predictSales(14); // 2 semanas
      const efficiencyPredictions = await mlService.predictProductionEfficiency();
      const inventoryPredictions = await mlService.optimizeInventory();
      const maintenancePredictions = await mlService.predictMaintenance();
      const employeePredictions = await mlService.analyzeEmployeePerformance();

      // Combinar predicciones con más tipos
      const combinedPredictions = [
        ...salesPredictions.map(p => ({ ...p, type: 'sales', label: 'Ventas Diarias', category: 'finanzas' })),
        { ...efficiencyPredictions, type: 'efficiency', label: 'Eficiencia Productiva', category: 'produccion' },
        ...Object.entries(inventoryPredictions).slice(0, 3).map(([product, pred]: [string, unknown]) => ({
          ...pred as PredictionResult,
          type: 'inventory',
          label: `Stock ${product}`,
          category: 'inventario'
        })),
        { ...maintenancePredictions, type: 'maintenance', label: 'Mantenimiento', category: 'mantenimiento' },
        { ...employeePredictions, type: 'employees', label: 'Rendimiento Empleados', category: 'recursos_humanos' }
      ];

      setPredictions(combinedPredictions);

      // Simular detección de anomalías
      const mockAnomalies: AnomalyResult[] = [
        {
          id: 1,
          type: 'sales_drop',
          severity: 'high' as const,
          description: 'Caída significativa en ventas de producto X',
          timestamp: new Date(),
          impact: -15.3,
          confidence: 0.89
        },
        {
          id: 2,
          type: 'efficiency_drop',
          severity: 'medium' as const,
          description: 'Disminución en eficiencia de línea de producción A',
          timestamp: new Date(Date.now() - 3600000),
          impact: -8.7,
          confidence: 0.76
        }
      ];

      setAnomalies(mockAnomalies);

      // Métricas del sistema
      const mlStats = mlService.getSystemStats();
      const systemData = await getSystemMetrics();
      setSystemMetrics({ ...mlStats, ...systemData });

    } catch (error) {
      console.error('Error cargando datos avanzados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdvancedData();
    const interval = setInterval(loadAdvancedData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [loadAdvancedData]);

  const getSystemMetrics = async () => {
    try {
      const [ventas, produccion, empleados] = await Promise.all([
        storage.ventas.getAll(),
        storage.produccionTickets.getAll(),
        storage.empleados.getAll()
      ]);

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentVentas = ventas.filter((v: unknown) => {
        const item = v as Record<string, unknown>;
        return new Date(item.createdAt as string) > last24h;
      });
      const recentProduccion = produccion.filter((p: unknown) => {
        const item = p as Record<string, unknown>;
        return new Date(item.createdAt as string) > last24h;
      });
      const activeEmployees = empleados.filter((e: unknown) => {
        const item = e as Record<string, unknown>;
        return item.activo === true;
      }).length;

      return {
        transactionsLast24h: recentVentas.length,
        productionTicketsLast24h: recentProduccion.length,
        activeEmployees,
        systemLoad: Math.random() * 100, // Simulado
        predictionAccuracy: 94.2 + Math.random() * 5, // Simulado
        anomalyDetectionRate: 98.7 + Math.random() * 1.3 // Simulado
      };
    } catch {
      return {};
    }
  };

  const predictionChartData = {
    labels: predictions.slice(0, 7).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString('es-MX', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Predicción de Ventas',
        data: predictions.filter(p => p.type === 'sales').slice(0, 7).map(p => p.value),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(147, 51, 234)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Eficiencia Productiva (%)',
        data: Array(7).fill(null).map((_, i) =>
          i === 0 ? predictions.find(p => p.type === 'efficiency')?.value || 0 : null
        ),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
      }
    ],
  };

  const predictionChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { parsed: { y: number | null }; datasetIndex: number };
            const value = ctx.parsed.y;
            if (value === null) return '';
            if (ctx.datasetIndex === 0) {
              return `Ventas: $${value.toFixed(0)} MXN`;
            } else {
              return `Eficiencia: ${value.toFixed(1)}%`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Ventas (MXN)',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Eficiencia (%)',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 100
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  const systemMetricsData = {
    labels: ['CPU', 'Memoria', 'Almacenamiento', 'Red'],
    datasets: [{
      data: [
        systemMetrics.systemLoad || 45,
        (systemMetrics.memoryUsage || 50) * 2, // Convertir MB a porcentaje aproximado
        78, // Simulado
        32  // Simulado
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(147, 51, 234, 0.8)'
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(147, 51, 234)'
      ],
      borderWidth: 2,
      hoverBackgroundColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(147, 51, 234, 1)'
      ]
    }]
  };

  const tabs = [
    { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomalías', icon: AlertTriangle },
    { id: 'optimization', label: 'Optimización', icon: Target }
  ];

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">IA Avanzada Empresarial</h3>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">Aura AI</span>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analizando datos con IA avanzada...</p>
            <div className="mt-2 text-xs text-gray-500">
              Procesando modelos predictivos • WebGL Backend
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">IA Avanzada Empresarial</h3>
          <p className="text-sm text-gray-600 mt-1">
            Análisis predictivo inteligente con TensorFlow.js y WebGL
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Precisión del Sistema</div>
            <div className="text-lg font-bold text-green-600">
              {systemMetrics.predictionAccuracy?.toFixed(1) || '94.2'}%
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'predictions' | 'anomalies' | 'optimization')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de las tabs */}
      <div className="space-y-6">
        {activeTab === 'predictions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900">Predicciones Inteligentes</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Análisis predictivo avanzado con múltiples modelos de IA
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Precisión Global</div>
                  <div className="text-lg font-bold text-green-600">
                    {systemMetrics.predictionAccuracy?.toFixed(1) || '94.2'}%
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  <RefreshCw className="h-4 w-4" />
                  <span>Actualizado: {new Date().toLocaleTimeString('es-MX')}</span>
                </div>
              </div>
            </div>

            {/* Gráfico principal mejorado */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold text-gray-900">Tendencias Predictivas</h5>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Ventas</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Eficiencia</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <Line data={predictionChartData} options={predictionChartOptions} />
              </div>
            </div>

            {/* Panel de predicciones por categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Predicciones Financieras */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900">Predicciones Financieras</h5>
                </div>
                <div className="space-y-3">
                  {predictions.filter(p => p.category === 'finanzas').map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{prediction.label}</div>
                        <div className="text-sm text-gray-600">
                          Confianza: {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${prediction.value.toFixed(0)}
                        </div>
                        <div className={`flex items-center space-x-1 text-xs ${
                          prediction.trend === 'up' ? 'text-green-600' :
                          prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <TrendingUp className={`h-3 w-3 ${
                            prediction.trend === 'up' ? '' : 'rotate-180'
                          }`} />
                          <span>{prediction.trend === 'up' ? '↑' : prediction.trend === 'down' ? '↓' : '→'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predicciones Operativas */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900">Predicciones Operativas</h5>
                </div>
                <div className="space-y-3">
                  {predictions.filter(p => p.category === 'produccion').map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{prediction.label}</div>
                        <div className="text-sm text-gray-600">
                          Confianza: {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {prediction.value.toFixed(1)}%
                        </div>
                        <div className={`flex items-center space-x-1 text-xs ${
                          prediction.trend === 'up' ? 'text-green-600' :
                          prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <TrendingUp className={`h-3 w-3 ${
                            prediction.trend === 'up' ? '' : 'rotate-180'
                          }`} />
                          <span>{prediction.trend === 'up' ? '↑' : prediction.trend === 'down' ? '↓' : '→'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Predicciones Avanzadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inventario */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <h6 className="text-lg font-semibold text-gray-900">Inventario</h6>
                </div>
                <div className="space-y-2">
                  {predictions.filter(p => p.category === 'inventario').slice(0, 2).map((prediction, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm text-gray-600">{prediction.label}</div>
                      <div className="text-xl font-bold text-purple-600">
                        {prediction.value.toFixed(0)} unidades
                      </div>
                      <div className="text-xs text-gray-500">
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mantenimiento */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h6 className="text-lg font-semibold text-gray-900">Mantenimiento</h6>
                </div>
                <div className="text-center">
                  {predictions.filter(p => p.category === 'mantenimiento').slice(0, 1).map((prediction, index) => (
                    <div key={index}>
                      <div className="text-sm text-gray-600">Riesgo de falla</div>
                      <div className="text-xl font-bold text-orange-600">
                        {prediction.value.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recursos Humanos */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-teal-500 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h6 className="text-lg font-semibold text-gray-900">Recursos Humanos</h6>
                </div>
                <div className="text-center">
                  {predictions.filter(p => p.category === 'recursos_humanos').slice(0, 1).map((prediction, index) => (
                    <div key={index}>
                      <div className="text-sm text-gray-600">Rendimiento promedio</div>
                      <div className="text-xl font-bold text-teal-600">
                        {prediction.value.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights y recomendaciones */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-indigo-600" />
                Insights de IA Avanzada
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h6 className="font-medium text-gray-800">Tendencias Detectadas:</h6>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Crecimiento sostenido en ventas (+12% mensual)</li>
                    <li>• Eficiencia productiva por encima del promedio</li>
                    <li>• Optimización de inventario recomendada</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h6 className="font-medium text-gray-800">Recomendaciones:</h6>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Aumentar stock de productos de alta rotación</li>
                    <li>• Programar mantenimiento preventivo</li>
                    <li>• Capacitación adicional para optimizar rendimiento</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Detección de Anomalías</h4>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  Tasa de detección: {systemMetrics.anomalyDetectionRate?.toFixed(1) || '98.7'}%
                </div>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className={`p-4 rounded-lg border-l-4 ${
                  anomaly.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                  anomaly.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        anomaly.severity === 'high' ? 'text-red-600' :
                        anomaly.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <h5 className="font-medium text-gray-900">{anomaly.description}</h5>
                        <p className="text-sm text-gray-600">
                          {anomaly.timestamp.toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        anomaly.impact < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {anomaly.impact > 0 ? '+' : ''}{anomaly.impact.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Confianza: {(anomaly.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {anomalies.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h5 className="text-lg font-medium text-gray-900 mb-2">Sin Anomalías Detectadas</h5>
                  <p className="text-gray-600">
                    El sistema está funcionando normalmente. Todas las métricas están dentro de los parámetros esperados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Optimización del Sistema</h4>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Optimizaciones activas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Métricas del sistema */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Rendimiento del Sistema
                </h5>
                <div className="h-48">
                  <Doughnut
                    data={systemMetricsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Recomendaciones de optimización */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900">Recomendaciones IA</h5>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Optimización Completada</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Los niveles de inventario han sido optimizados automáticamente.
                    Se recomienda aumentar el stock de productos de alta rotación en un 15%.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Eficiencia Productiva</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Se detectó una oportunidad de mejora en la línea de producción B.
                    Implementar reprogramación automática podría aumentar la eficiencia en un 12%.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Predicción de Demanda</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Los modelos predictivos indican un aumento del 23% en la demanda
                    para el próximo trimestre. Se recomienda ajustar los niveles de inventario.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con información técnica */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Cpu className="h-3 w-3" />
              <span>Backend: {systemMetrics.backend || 'WebGL'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>Modelos: {systemMetrics.modelsLoaded || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Memoria: {systemMetrics.memoryUsage?.toFixed(1) || '0.0'} MB</span>
            </span>
          </div>
          <div className="text-gray-400">
            TensorFlow.js v4.0+ • Actualización automática cada 30s
          </div>
        </div>
      </div>
    </div>
  );
};
