import React from 'react';
import { Users, DollarSign, Package, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Empleados Activos', value: '24', icon: Users, color: 'bg-blue-500' },
    { title: 'Ventas del Día', value: '$12,450', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Productos en Stock', value: '1,247', icon: Package, color: 'bg-purple-500' },
    { title: 'Eficiencia General', value: '89%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const recentActivities = [
    { type: 'checkin', user: 'Juan Pérez', action: 'Entrada registrada', time: '08:00 AM' },
    { type: 'sale', user: 'María García', action: 'Venta procesada $450', time: '08:15 AM' },
    { type: 'production', user: 'Carlos López', action: 'Proceso completado', time: '08:30 AM' },
    { type: 'inventory', user: 'Sistema', action: 'Stock actualizado', time: '09:00 AM' },
  ];

  const alerts = [
    { message: 'Stock bajo en 3 productos', type: 'warning' },
    { message: '3 empleados pendientes de marcar salida', type: 'info' },
    { message: 'Metas del día alcanzadas al 89%', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg mr-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades Recientes</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-md">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-xs text-gray-500">{activity.action}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Notificaciones</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-md ${
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                alert.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  alert.type === 'warning' ? 'text-yellow-600' :
                  alert.type === 'info' ? 'text-blue-600' :
                  'text-green-600'
                }`} />
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Semanales</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Gráficos y métricas</p>
            <p className="text-sm text-gray-400">Integración con biblioteca de gráficos pendiente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;