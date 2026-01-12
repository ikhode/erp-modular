import React, {useEffect, useState} from 'react';
import {Line} from 'react-chartjs-2';
import {AlertTriangle, Minus, Package, Target, TrendingDown, TrendingUp, Users, Zap} from 'lucide-react';
import {mlService, PredictionResult} from '../lib/mlService';

interface AIWidgetProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const AIWidget: React.FC<AIWidgetProps> = ({ title, icon, className = '', children }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-purple-600 font-medium">Aura AI</span>
      </div>
    </div>
    {children}
  </div>
);

interface SalesPredictionWidgetProps {
  className?: string;
}

export const SalesPredictionWidget: React.FC<SalesPredictionWidgetProps> = ({ className }) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const salesPredictions = await mlService.predictSales(7);
        setPredictions(salesPredictions);
      } catch (error) {
        console.error('Error cargando predicciones de ventas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  const chartData = {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString('es-MX', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Predicción de Ventas',
        data: predictions.map(p => p.value),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const totalProjected = predictions.reduce((sum, p) => sum + p.value, 0);
  const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return (
    <AIWidget
      title="Predicción de Ventas Inteligente"
      icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
      className={className}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <Line data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `$${(context.parsed.y || 0).toFixed(0)} MXN`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `$${(value as number).toFixed(0)}`
                }
              }
            }
          }} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Proyectado</p>
              <p className="text-2xl font-bold text-purple-600">${totalProjected.toFixed(0)} MXN</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Confianza Promedio</p>
              <p className="text-2xl font-bold text-green-600">{(averageConfidence * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>Día {index + 1}:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">${prediction.value.toFixed(0)}</span>
                  <div className={`flex items-center space-x-1 ${
                    prediction.trend === 'up' ? 'text-green-600' :
                    prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {prediction.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {prediction.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    {prediction.trend === 'stable' && <Minus className="h-3 w-3" />}
                    <span className="text-xs">{(prediction.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AIWidget>
  );
};

interface ProductionEfficiencyWidgetProps {
  className?: string;
}

export const ProductionEfficiencyWidget: React.FC<ProductionEfficiencyWidgetProps> = ({ className }) => {
  const [efficiency, setEfficiency] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEfficiency = async () => {
      try {
        const result = await mlService.predictProductionEfficiency();
        setEfficiency(result);
      } catch (error) {
        console.error('Error cargando eficiencia productiva:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEfficiency();
  }, []);

  const getEfficiencyColor = (value: number) => {
    if (value >= 85) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBg = (value: number) => {
    if (value >= 85) return 'bg-green-100';
    if (value >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <AIWidget
      title="Eficiencia Productiva IA"
      icon={<Target className="h-5 w-5 text-blue-600" />}
      className={className}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : efficiency ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getEfficiencyBg(efficiency.value)}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getEfficiencyColor(efficiency.value)}`}>
                  {efficiency.value.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Eficiencia</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Confianza</div>
              <div className="text-lg font-semibold text-gray-900">
                {(efficiency.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Tendencia</div>
              <div className="flex items-center justify-center space-x-1">
                {efficiency.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {efficiency.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                {efficiency.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                <span className="text-sm font-semibold">
                  {efficiency.trend === 'up' ? 'Mejorando' :
                   efficiency.trend === 'down' ? 'Disminuyendo' : 'Estable'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Insights de IA:</h4>
            {efficiency.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Error cargando datos de eficiencia
        </div>
      )}
    </AIWidget>
  );
};

interface InventoryOptimizationWidgetProps {
  className?: string;
}

export const InventoryOptimizationWidget: React.FC<InventoryOptimizationWidgetProps> = ({ className }) => {
  const [recommendations, setRecommendations] = useState<Record<string, PredictionResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const result = await mlService.optimizeInventory();
        setRecommendations(result);
      } catch (error) {
        console.error('Error cargando recomendaciones de inventario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const topRecommendations = Object.entries(recommendations)
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 5);

  return (
    <AIWidget
      title="Optimización de Inventario IA"
      icon={<Package className="h-5 w-5 text-green-600" />}
      className={className}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {topRecommendations.length > 0 ? (
            <>
              <div className="space-y-3">
                {topRecommendations.map(([product, rec], index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 truncate" title={product}>
                        {product}
                      </div>
                      <div className="text-sm text-gray-600">
                        Stock óptimo: {rec.value.toFixed(0)} unidades
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${
                        rec.trend === 'up' ? 'text-green-600' :
                        rec.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {rec.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                        {rec.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                        {rec.trend === 'stable' && <Minus className="h-3 w-3" />}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(rec.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">confianza</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Productos analizados:</span>
                  <span className="font-medium">{Object.keys(recommendations).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Recomendaciones activas:</span>
                  <span className="font-medium text-green-600">
                    {Object.values(recommendations).filter(r => r.trend !== 'stable').length}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos de inventario para analizar
            </div>
          )}
        </div>
      )}
    </AIWidget>
  );
};

interface MaintenancePredictionWidgetProps {
  className?: string;
}

export const MaintenancePredictionWidget: React.FC<MaintenancePredictionWidgetProps> = ({ className }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const result = await mlService.predictMaintenance();
        setPrediction(result);
      } catch (error) {
        console.error('Error cargando predicciones de mantenimiento:', error);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'text-red-600 bg-red-100';
    if (risk > 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getRiskIcon = (risk: number) => {
    if (risk > 70) return <AlertTriangle className="h-4 w-4" />;
    if (risk > 40) return <TrendingUp className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  return (
    <AIWidget
      title="Predicción de Mantenimiento IA"
      icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
      className={className}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : prediction ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${getRiskColor(prediction.value)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getRiskIcon(prediction.value)}
                <div>
                  <div className="font-medium text-gray-900">Sistema General</div>
                  <div className="text-sm text-gray-600">
                    Riesgo: {prediction.value.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {(prediction.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">confianza</div>
              </div>
            </div>

            {prediction.insights.length > 0 && (
              <div className="mt-2 text-sm text-gray-700">
                {prediction.insights.map((insight, idx) => (
                  <div key={idx}>• {insight}</div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estado del Sistema</span>
              <span className={`font-medium ${prediction.trend === 'up' ? 'text-red-600' : prediction.trend === 'down' ? 'text-green-600' : 'text-blue-600'}`}>
                {prediction.trend === 'up' ? 'Requiere Atención' : prediction.trend === 'down' ? 'Estable' : 'Monitoreo'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos de equipos para analizar
        </div>
      )}
    </AIWidget>
  );
};

interface EmployeePerformanceWidgetProps {
  className?: string;
}

export const EmployeePerformanceWidget: React.FC<EmployeePerformanceWidgetProps> = ({ className }) => {
  const [performance, setPerformance] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const result = await mlService.analyzeEmployeePerformance();
        setPerformance(result);
      } catch (error) {
        console.error('Error cargando análisis de empleados:', error);
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, []);

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <AIWidget
      title="Rendimiento de Empleados IA"
      icon={<Users className="h-5 w-5 text-indigo-600" />}
      className={className}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : performance ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${getPerformanceColor(performance.value)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <div>
                  <div className="font-medium text-gray-900">Equipo General</div>
                  <div className="text-sm text-gray-600">
                    Rendimiento Promedio: {performance.value.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {(performance.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">confianza</div>
              </div>
            </div>

            {performance.insights.length > 0 && (
              <div className="mt-2 text-sm text-gray-700">
                {performance.insights.map((insight, idx) => (
                  <div key={idx}>• {insight}</div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tendencia del Equipo</span>
              <div className="flex items-center space-x-1">
                {performance.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {performance.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                {performance.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                <span className={`font-medium ${
                  performance.trend === 'up' ? 'text-green-600' :
                  performance.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {performance.trend === 'up' ? 'Mejorando' :
                   performance.trend === 'down' ? 'Disminuyendo' : 'Estable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos de empleados para analizar
        </div>
      )}
    </AIWidget>
  );
};
