import React, {useEffect, useState} from 'react';
import {AlertCircle, Clock, DollarSign, Package, TrendingUp, Users} from 'lucide-react';
import {storage} from '../lib/storage';
import {ProduccionTicket} from "../lib/db.ts";

const Dashboard: React.FC = () => {
  // Estado para estadísticas y actividades recientes
  const [stats, setStats] = useState([
    { title: 'Empleados Activos', value: '...', icon: Users, color: 'bg-blue-500' },
    { title: 'Ventas del Día', value: '...', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Productos en Stock', value: '...', icon: Package, color: 'bg-purple-500' },
    { title: 'Eficiencia General', value: '...', icon: TrendingUp, color: 'bg-orange-500' },
  ]);
  interface RecentActivity {
    type: 'sale' | 'production' | 'inventory';
    user: string;
    action: string;
    time: string;
  }
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  interface AlertItem {
    type: string;
    message: string;
    level: 'info' | 'warning' | 'error';
  }
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    // Cargar datos reales de IndexedDB
    const fetchStats = async () => {
      // Empleados activos
      const empleados = await storage.empleados.getAll();
      const activos = empleados.filter(e => e.rol && e.rol !== 'inactivo').length;
      // Ventas del día
      const ventas = await storage.ventas.getAll();
      const hoy = new Date();
      const ventasHoy = ventas.filter(v => {
        const fecha = new Date(v.createdAt);
        return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
      });
      const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + (v.cantidad * v.precioUnitario), 0);
      // Productos en stock
      const inventario = await storage.inventario.getAll();
      const totalStock = inventario.reduce((acc, i) => acc + i.cantidad, 0);
      // Eficiencia general (placeholder: % de procesos completados)
      const produccion = await storage.produccionTickets.getAll();
      const completados = produccion.filter((p: ProduccionTicket) => p.estado === 'completado').length;
      const eficiencia = produccion.length > 0 ? Math.round((completados / produccion.length) * 100) : 0;
      setStats([
        { title: 'Empleados Activos', value: activos.toString(), icon: Users, color: 'bg-blue-500' },
        { title: 'Ventas del Día', value: `$${totalVentasHoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-green-500' },
        { title: 'Productos en Stock', value: totalStock.toString(), icon: Package, color: 'bg-purple-500' },
        { title: 'Eficiencia General', value: `${eficiencia}%`, icon: TrendingUp, color: 'bg-orange-500' },
      ]);
    };
    // Actividades recientes (últimos movimientos de ventas, producción, inventario)
    const fetchRecentActivities = async () => {
      const ventas = await storage.ventas.getAll();
      const produccion = await storage.produccionTickets.getAll();
      const inventario = await storage.inventario.getAll();
      const actividades: RecentActivity[] = [];
      ventas.slice(-3).reverse().forEach(v => actividades.push({ type: 'sale', user: 'Sistema', action: `Venta procesada $${(v.cantidad * v.precioUnitario).toFixed(2)}`, time: new Date(v.createdAt).toLocaleTimeString() }));
      produccion.slice(-3).reverse().forEach((p: ProduccionTicket) => actividades.push({ type: 'production', user: 'Sistema', action: `Producción: ${p.cantidadProducida} unidades`, time: new Date(p.createdAt).toLocaleTimeString() }));
      inventario.slice(-3).reverse().forEach(i => actividades.push({ type: 'inventory', user: 'Sistema', action: `Stock actualizado`, time: new Date(i.updatedAt).toLocaleTimeString() }));
      actividades.sort((a, b) => b.time.localeCompare(a.time));
      setRecentActivities(actividades.slice(0, 6));
    };
    // Alertas dinámicas
    const fetchAlerts = async () => {
      const inventario = await storage.inventario.getAll();
      const productosBajos = inventario.filter(i => i.cantidad < 10).length;
      const empleados = await storage.empleados.getAll();
      // Placeholder: empleados sin salida (no implementado, ejemplo)
      const empleadosPendientes = empleados.filter(e => e.rol && e.rol !== 'inactivo').length - 1;
      const produccion = await storage.produccionTickets.getAll();
      const eficiencia = produccion.length > 0 ? Math.round((produccion.filter(p => p.estado === 'completado').length / produccion.length) * 100) : 0;
      const alertsArr: AlertItem[] = [];
      if (productosBajos > 0) alertsArr.push({ message: `Stock bajo en ${productosBajos} productos`, type: 'warning', level: 'warning' });
      if (empleadosPendientes > 0) alertsArr.push({ message: `${empleadosPendientes} empleados pendientes de marcar salida`, type: 'info', level: 'info' });
      if (eficiencia > 0) alertsArr.push({ message: `Metas del día alcanzadas al ${eficiencia}%`, type: 'success', level: 'info' });
      setAlerts(alertsArr);
    };
    fetchStats();
    fetchRecentActivities();
    fetchAlerts();
  }, []);

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