import React, {useEffect, useState} from 'react';
import {Clock, DollarSign, Download, Factory, FileText, Package, TrendingUp, Users} from 'lucide-react';
import {storage} from '../lib/storage';
import {Attendance, Empleado, ProduccionTicket, Producto, Venta} from '../lib/db';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('ventas');
  const [dateRange, setDateRange] = useState('7');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [produccion, setProduccion] = useState<ProduccionTicket[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [asistencia, setAsistencia] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventasData, produccionData, empleadosData, inventarioData, productosData, asistenciaData] = await Promise.all([
        storage.ventas.getAll(),
        storage.produccion.getAll(),
        storage.empleados.getAll(),
        storage.inventario.getAll(),
        storage.productos.getAll(),
        storage.asistencia.getAll()
      ]);
      setVentas(ventasData);
      setProduccion(produccionData);
      setEmpleados(empleadosData);
      setInventario(inventarioData);
      setProductos(productosData);
      setAsistencia(asistenciaData);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'ventas', name: 'Reporte de Ventas', icon: DollarSign, description: 'Análisis detallado de ventas por período' },
    { id: 'produccion', name: 'Reporte de Producción', icon: Factory, description: 'Métricas de producción y eficiencia' },
    { id: 'empleados', name: 'Reporte de Empleados', icon: Users, description: 'Asistencia y productividad del personal' },
    { id: 'inventario', name: 'Reporte de Inventario', icon: Package, description: 'Estado actual y movimientos de stock' },
  ];

  const salesData = {
    totalSales: ventas.reduce((total, venta) => total + venta.total, 0),
    transactions: ventas.length,
    avgTicket: ventas.reduce((total, venta) => total + venta.total, 0) / ventas.length || 0,
    topProducts: productos.map(producto => ({
      name: producto.nombre,
      quantity: ventas.reduce((total, venta) => total + (venta.productos.find(p => p.id === producto.id)?.cantidad || 0), 0),
      revenue: ventas.reduce((total, venta) => total + (venta.productos.find(p => p.id === producto.id)?.cantidad || 0) * producto.precio, 0)
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 3),
    dailySales: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const amount = ventas.filter(venta => {
        const ventaDate = new Date(venta.fecha);
        return ventaDate.getDate() === date.getDate() && ventaDate.getMonth() === date.getMonth() && ventaDate.getFullYear() === date.getFullYear();
      }).reduce((total, venta) => total + venta.total, 0);
      return { date: dayString, amount };
    }).reverse()
  };

  const productionData = {
    totalProduced: produccion.reduce((total, prod) => total + prod.cantidad, 0),
    efficiency: produccion.reduce((total, prod) => total + prod.eficiencia, 0) / produccion.length || 0,
    downtime: '2.5h',
    topLines: [
      { name: 'Línea A - Rallado', produced: 650, efficiency: 92 },
      { name: 'Línea B - Deshidratado', produced: 400, efficiency: 85 },
      { name: 'Línea C - Aceite', produced: 200, efficiency: 78 },
    ]
  };

  const employeeData = {
    totalEmployees: empleados.length,
    presentToday: asistencia.filter(a => a.fecha === new Date().toISOString().split('T')[0]).length,
    avgHours: asistencia.reduce((total, a) => total + a.horasTrabajadas, 0) / asistencia.length || 0,
    overtime: asistencia.filter(a => a.horasExtra > 0).reduce((total, a) => total + a.horasExtra, 0),
    topPerformers: empleados.map(empleado => ({
      name: empleado.nombre,
      hours: asistencia.filter(a => a.empleadoId === empleado.id).reduce((total, a) => total + a.horasTrabajadas, 0),
      efficiency: produccion.filter(p => p.empleadoId === empleado.id).reduce((total, p) => total + p.eficiencia, 0) / produccion.filter(p => p.empleadoId === empleado.id).length || 0
    })).sort((a, b) => b.efficiency - a.efficiency).slice(0, 3)
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold">${salesData.totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold">{salesData.transactions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold">${salesData.avgTicket.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Productos Vendidos</p>
              <p className="text-2xl font-bold">201</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h4>
          <div className="space-y-3">
            {salesData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.quantity} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ventas Diarias</h4>
          <div className="space-y-2">
            {salesData.dailySales.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day.date}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(day.amount / 8500) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">${day.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductionReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Producido</p>
              <p className="text-2xl font-bold">{productionData.totalProduced}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Eficiencia Promedio</p>
              <p className="text-2xl font-bold">{productionData.efficiency}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Tiempo Inactivo</p>
              <p className="text-2xl font-bold">{productionData.downtime}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Factory className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Líneas Activas</p>
              <p className="text-2xl font-bold">3/3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Línea</h4>
        <div className="space-y-4">
          {productionData.topLines.map((line, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{line.name}</h5>
                <span className="text-sm font-bold text-gray-900">{line.produced} unidades</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Eficiencia</span>
                    <span>{line.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${line.efficiency >= 90 ? 'bg-green-500' : line.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${line.efficiency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmployeeReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold">{employeeData.totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Presentes Hoy</p>
              <p className="text-2xl font-bold">{employeeData.presentToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Horas Promedio</p>
              <p className="text-2xl font-bold">{employeeData.avgHours}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Horas Extra</p>
              <p className="text-2xl font-bold">{employeeData.overtime}h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Mejores Desempeños</h4>
        <div className="space-y-3">
          {employeeData.topPerformers.map((employee, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{employee.name}</p>
                <p className="text-sm text-gray-600">{employee.hours}h trabajadas</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{employee.efficiency}% eficiencia</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'ventas':
        return renderSalesReport();
      case 'produccion':
        return renderProductionReport();
      case 'empleados':
        return renderEmployeeReport();
      case 'inventario':
        return <div className="text-center py-12 text-gray-500">Reporte de inventario en desarrollo</div>;
      default:
        return renderSalesReport();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Último mes</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último año</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Icon className={`h-6 w-6 mb-2 ${
                selectedReport === report.id ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <h3 className="font-semibold text-gray-900">{report.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;

