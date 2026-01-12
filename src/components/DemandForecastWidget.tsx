import React, {useEffect, useState} from 'react';
import {Line} from 'react-chartjs-2';
import {BarChart3, Calendar, TrendingUp} from 'lucide-react';
import {mlService, PredictionResult} from '../lib/mlService';

interface DemandForecastWidgetProps {
  className?: string;
  productId?: number;
}

export const DemandForecastWidget: React.FC<DemandForecastWidgetProps> = ({
  className,
  productId
}) => {
  const [forecast, setForecast] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        if (!productId) {
          setForecast([]);
          return;
        }
        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        const result = await mlService.forecastDemand(productId);
        setForecast(result.slice(0, days));
      } catch (error) {
        console.error('Error cargando pronóstico de demanda:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [productId, selectedPeriod]);

  const chartData = {
    labels: forecast.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date.toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric'
      });
    }),
    datasets: [
      {
        label: 'Demanda Pronosticada',
        data: forecast.map(f => f.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: forecast.map(f =>
          f.trend === 'up' ? 'rgb(34, 197, 94)' :
          f.trend === 'down' ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'
        ),
        pointBorderColor: forecast.map(f =>
          f.trend === 'up' ? 'rgb(34, 197, 94)' :
          f.trend === 'down' ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'
        ),
        pointRadius: 4,
      },
      {
        label: 'Tendencia',
        data: forecast.map((_, index) => {
          // Calcular línea de tendencia
          const window = forecast.slice(Math.max(0, index - 3), index + 1);
          return window.reduce((sum, val) => sum + val.value, 0) / window.length;
        }),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  const totalDemand = forecast.reduce((sum, f) => sum + f.value, 0);
  const averageDemand = totalDemand / forecast.length;
  const peakDemand = Math.max(...forecast.map(f => f.value));
  const lowDemand = Math.min(...forecast.map(f => f.value));
  const unit = forecast[0]?.unit || 'unidades'; // Obtener unidad del primer forecast

  const getDemandLevel = (value: number) => {
    const range = peakDemand - lowDemand;
    if (range === 0) return 'estable';
    const normalized = (value - lowDemand) / range;
    if (normalized > 0.7) return 'alto';
    if (normalized > 0.4) return 'medio';
    return 'bajo';
  };

  const demandInsights = [
    {
      label: 'Demanda Promedio',
      value: `${averageDemand.toFixed(1)} ${unit}`,
      level: getDemandLevel(averageDemand)
    },
    {
      label: 'Pico de Demanda',
      value: `${peakDemand.toFixed(1)} ${unit}`,
      level: 'alto'
    },
    {
      label: 'Demanda Mínima',
      value: `${lowDemand.toFixed(1)} ${unit}`,
      level: 'bajo'
    }
  ];

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Pronóstico de Demanda IA
            </h3>
            <p className="text-sm text-gray-600">
              Análisis predictivo con CNN Aura AI
            </p>
          </div>
        </div>

        {/* Selector de período */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">7 días</option>
            <option value="30d">30 días</option>
            <option value="90d">90 días</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analizando patrones de demanda...</p>
            <p className="text-sm text-gray-500 mt-1">Procesando datos históricos con IA</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gráfico principal */}
          <div className="h-80">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed.y || 0;
                        const dayIndex = context.dataIndex;
                        const prediction = forecast[dayIndex] || { confidence: 0 };
                        const level = getDemandLevel(value);

                        return [
                          `${context.dataset.label}: ${value.toFixed(1)} unidades`,
                          `Nivel: ${level}`,
                          `Confianza: ${(prediction.confidence * 100).toFixed(0)}%`
                        ];
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Unidades Demandadas'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Fecha'
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                }
              }}
            />
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {demandInsights.map((insight, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{insight.label}</div>
                <div className={`text-xl font-bold ${insight.color}`}>
                  {insight.value} {insight.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Insights de IA */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
              Insights de Inteligencia Artificial
            </h4>
            <div className="space-y-2 text-sm">
              {forecast.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Patrón detectado:</span>
                    <span className={`font-medium ${
                      forecast.filter(f => f.trend === 'up').length > forecast.filter(f => f.trend === 'down').length
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {forecast.filter(f => f.trend === 'up').length > forecast.filter(f => f.trend === 'down').length
                        ? 'Tendencia alcista' : 'Tendencia bajista'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Volatilidad:</span>
                    <span className={`font-medium ${
                      (peakDemand - lowDemand) / averageDemand > 0.5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(peakDemand - lowDemand) / averageDemand > 0.5 ? 'Alta' : 'Baja'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Pronóstico confiable:</span>
                    <span className={`font-medium ${
                      forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length > 0.8
                        ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length > 0.8
                        ? 'Sí' : 'Moderado'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Recomendaciones</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {peakDemand > averageDemand * 1.5 && (
                <li>• Preparar inventario adicional para picos de demanda</li>
              )}
              {forecast.filter(f => f.trend === 'up').length > forecast.length * 0.6 && (
                <li>• Considerar expansión de producción por demanda creciente</li>
              )}
              {forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length < 0.7 && (
                <li>• Recopilar más datos históricos para mejorar precisión</li>
              )}
              <li>• Monitorear tendencias semanales para ajustes operativos</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
