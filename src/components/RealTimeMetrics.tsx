import React, {useEffect, useRef, useState} from 'react';
import {Activity, Cpu, HardDrive, Wifi, WifiOff, Zap} from 'lucide-react';

interface RealTimeMetricsProps {
  className?: string;
}

interface MetricData {
  cpu: number;
  memory: number;
  network: number;
  gpu?: number;
  timestamp: Date;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<MetricData>({
    cpu: 0,
    memory: 0,
    network: 0,
    gpu: 0,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Simular conexión WebSocket
    const connectWebSocket = () => {
      setIsConnected(true);

      // Simular recepción de métricas en tiempo real
      intervalRef.current = setInterval(() => {
        setMetrics(prev => ({
          cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
          network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
          gpu: Math.max(0, Math.min(100, (prev.gpu || 0) + (Math.random() - 0.5) * 15)),
          timestamp: new Date()
        }));
      }, 2000); // Actualizar cada 2 segundos
    };

    connectWebSocket();

    // Simular desconexión ocasional
    const disconnectInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% de probabilidad de desconexión
        setIsConnected(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setTimeout(() => {
          connectWebSocket();
        }, 3000); // Reconectar en 3 segundos
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(disconnectInterval);
    };
  }, []);

  const getMetricColor = (value: number) => {
    if (value > 80) return 'text-red-600';
    if (value > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMetricBg = (value: number) => {
    if (value > 80) return 'bg-red-100';
    if (value > 60) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Métricas en Tiempo Real</h3>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className={`p-4 rounded-lg ${getMetricBg(metrics.cpu)}`}>
          <div className="flex items-center justify-between mb-2">
            <Cpu className={`h-5 w-5 ${getMetricColor(metrics.cpu)}`} />
            <span className={`text-sm font-medium ${getMetricColor(metrics.cpu)}`}>
              {metrics.cpu.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">CPU IA</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.cpu > 80 ? 'bg-red-600' :
                metrics.cpu > 60 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${metrics.cpu}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className={`p-4 rounded-lg ${getMetricBg(metrics.memory)}`}>
          <div className="flex items-center justify-between mb-2">
            <HardDrive className={`h-5 w-5 ${getMetricColor(metrics.memory)}`} />
            <span className={`text-sm font-medium ${getMetricColor(metrics.memory)}`}>
              {metrics.memory.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Memoria</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.memory > 80 ? 'bg-red-600' :
                metrics.memory > 60 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${metrics.memory}%` }}
            ></div>
          </div>
        </div>

        {/* Network Usage */}
        <div className={`p-4 rounded-lg ${getMetricBg(metrics.network)}`}>
          <div className="flex items-center justify-between mb-2">
            <Activity className={`h-5 w-5 ${getMetricColor(metrics.network)}`} />
            <span className={`text-sm font-medium ${getMetricColor(metrics.network)}`}>
              {metrics.network.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">Red</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.network > 80 ? 'bg-red-600' :
                metrics.network > 60 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${metrics.network}%` }}
            ></div>
          </div>
        </div>

        {/* GPU Usage */}
        <div className={`p-4 rounded-lg ${getMetricBg(metrics.gpu || 0)}`}>
          <div className="flex items-center justify-between mb-2">
            <Zap className={`h-5 w-5 ${getMetricColor(metrics.gpu || 0)}`} />
            <span className={`text-sm font-medium ${getMetricColor(metrics.gpu || 0)}`}>
              {(metrics.gpu || 0).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">GPU TensorFlow</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                (metrics.gpu || 0) > 80 ? 'bg-red-600' :
                (metrics.gpu || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${metrics.gpu || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Última actualización:</span>
          <span className="font-medium">
            {metrics.timestamp.toLocaleTimeString('es-MX', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
          <span>Estado del sistema:</span>
          <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Operativo' : 'Sincronizando...'}
          </span>
        </div>
      </div>

      {/* Indicador de actividad de IA */}
      <div className="mt-4 flex items-center justify-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-500">
          {isConnected ? 'IA procesando datos en tiempo real' : 'Reconectando con servidor de IA...'}
        </span>
      </div>
    </div>
  );
};
