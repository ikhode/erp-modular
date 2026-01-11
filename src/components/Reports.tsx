import React, {useEffect, useState} from 'react';
import {
    BarChart3,
    Clock,
    DollarSign,
    Download,
    Factory,
    FileText,
    Filter,
    Package,
    PieChart,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react';
import {storage} from '../lib/storage';
import {Compra, Empleado, Inventario, ProduccionTicket, Producto, Venta} from '../lib/db';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
  employee: string;
  product: string;
}

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('dashboard');
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    category: 'all',
    status: 'all',
    employee: 'all',
    product: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [produccion, setProduccion] = useState<ProduccionTicket[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        ventasData,
        comprasData,
        produccionData,
        empleadosData,
        productosData,
        inventarioData
      ] = await Promise.all([
        storage.ventas.getAll(),
        storage.compras.getAll(),
        storage.produccionTickets.getAll(),
        storage.empleados.getAll(),
        storage.productos.getAll(),
        storage.inventario.getAll()
      ]);

      setVentas(ventasData);
      setCompras(comprasData);
      setProduccion(produccionData);
      setEmpleados(empleadosData);
      setProductos(productosData);
      setInventario(inventarioData);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDate = <T extends { createdAt: Date }>(data: T[]): T[] => {
    return data.filter(item => {
      const itemDate = item.createdAt;
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      return itemDate >= fromDate && itemDate <= toDate;
    });
  };

  const reportTypes = [
    { id: 'dashboard', name: 'Dashboard Ejecutivo', icon: BarChart3, description: 'Vista general del negocio' },
    { id: 'ventas', name: 'Análisis de Ventas', icon: DollarSign, description: 'Métricas detalladas de ventas' },
    { id: 'compras', name: 'Análisis de Compras', icon: Package, description: 'Gestión de proveedores y costos' },
    { id: 'produccion', name: 'Eficiencia Productiva', icon: Factory, description: 'Métricas de producción y calidad' },
    { id: 'empleados', name: 'Gestión del Personal', icon: Users, description: 'Productividad y asistencia' },
    { id: 'inventario', name: 'Control de Inventario', icon: TrendingUp, description: 'Stock y movimientos' },
    { id: 'financiero', name: 'Análisis Financiero', icon: PieChart, description: 'Estados financieros y márgenes' },
  ];

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    setExporting(true);
    try {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map((row: Record<string, unknown>) =>
          headers.map((header: string) => JSON.stringify(row[header] || '')).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error al exportar el archivo');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-MX');
  };

  const renderDashboard = () => {
    const filteredVentas = filterDataByDate(ventas);
    const filteredCompras = filterDataByDate(compras);
    const filteredProduccion = filterDataByDate(produccion);

    const totalVentas = filteredVentas.reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);
    const totalCompras = filteredCompras.reduce((sum, c) => sum + (c.totalAmount || (c.cantidad * c.precioUnitario)), 0);
    const totalProducido = filteredProduccion.reduce((sum, p) => sum + p.cantidadProducida, 0);
    const margenBruto = totalVentas - totalCompras;

    return (
      <div className="space-y-6">
        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalVentas)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +12% vs mes anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costos Totales</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCompras)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  -5% vs mes anterior
                </p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margen Bruto</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(margenBruto)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((margenBruto / totalVentas) * 100).toFixed(1)}% margen
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Producción Total</p>
                <p className="text-2xl font-bold text-purple-600">{totalProducido.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  unidades producidas
                </p>
              </div>
              <Factory className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Gráficos y Métricas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia de Ventas */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas (Últimos 7 días)</h4>
            <div className="space-y-3">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const daySales = filteredVentas.filter(v => {
                  const vDate = new Date(v.createdAt);
                  return vDate.toDateString() === date.toDateString();
                }).reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);

                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-16">{date.toLocaleDateString('es-MX', { weekday: 'short' })}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((daySales / 10000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(daySales)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Productos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h4>
            <div className="space-y-3">
              {productos.map(producto => {
                const productSales = filteredVentas.filter(v => v.productoId === producto.id);
                const totalSold = productSales.reduce((sum, v) => sum + v.cantidad, 0);
                const totalRevenue = productSales.reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);

                return totalSold > 0 ? (
                  <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-gray-600">{totalSold} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                ) : null;
              }).filter(Boolean).slice(0, 5)}
            </div>
          </div>
        </div>

        {/* Alertas y Notificaciones */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Alertas del Sistema</h4>
          <div className="space-y-3">
            {inventario.filter(item => item.cantidad <= item.minimo).length > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <TrendingDown className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">Productos con Stock Bajo</p>
                  <p className="text-sm text-yellow-700">
                    {inventario.filter(item => item.cantidad <= item.minimo).length} productos requieren atención
                  </p>
                </div>
              </div>
            )}

            {produccion.filter(p => p.estado === 'pendiente').length > 0 && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-800">Tickets de Producción Pendientes</p>
                  <p className="text-sm text-blue-700">
                    {produccion.filter(p => p.estado === 'pendiente').length} tickets requieren procesamiento
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    const filteredVentas = filterDataByDate(ventas);
    const totalSales = filteredVentas.reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);
    const totalTransactions = filteredVentas.length;
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold">{formatCurrency(avgTicket)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Productos Vendidos</p>
              <p className="text-2xl font-bold">
                {filteredVentas.reduce((sum, v) => sum + v.cantidad, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Análisis Detallado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Producto</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {productos.map(producto => {
                const productSales = filteredVentas.filter(v => v.productoId === producto.id);
                const quantity = productSales.reduce((sum, v) => sum + v.cantidad, 0);
                const revenue = productSales.reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);

                return quantity > 0 ? (
                  <div key={producto.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-gray-600">{quantity} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(revenue)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(revenue / quantity)}/unidad</p>
                    </div>
                  </div>
                ) : null;
              }).filter(Boolean)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tendencia Diaria</h4>
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const daySales = filteredVentas.filter(v => {
                  const vDate = new Date(v.createdAt);
                  return vDate.toDateString() === date.toDateString();
                }).reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);

                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}</span>
                    <div className="flex items-center space-x-2 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min((daySales / Math.max(...Array.from({ length: 7 }, (_, j) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - j));
                            return filteredVentas.filter(v => {
                              const vDate = new Date(v.createdAt);
                              return vDate.toDateString() === d.toDateString();
                            }).reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);
                          }))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium ml-2">{formatCurrency(daySales)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabla de Ventas Detalladas */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Transacciones Recientes</h4>
              <button
                onClick={() => exportToCSV(filteredVentas, 'reporte_ventas')}
                disabled={exporting}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVentas.slice(0, 10).map((venta) => {
                    const producto = productos.find(p => p.id === venta.productoId);
                    return (
                      <tr key={venta.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(venta.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto?.nombre || 'Producto no encontrado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(venta.precioUnitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(venta.totalAmount || (venta.cantidad * venta.precioUnitario))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes Avanzados</h1>
          <p className="text-gray-600">Análisis detallado y métricas del negocio</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avanzados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas</option>
                <option value="ventas">Ventas</option>
                <option value="compras">Compras</option>
                <option value="produccion">Producción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              <select
                value={filters.product}
                onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                {productos.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Reportes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition-shadow ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-8 w-8 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div>
                      <h3 className={`font-semibold ${
                        selectedReport === report.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {report.name}
                      </h3>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido del Reporte */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {selectedReport === 'dashboard' && renderDashboard()}
          {selectedReport === 'ventas' && renderSalesReport()}
          {/* Aquí se agregarían los otros reportes */}
          {selectedReport !== 'dashboard' && selectedReport !== 'ventas' && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Reporte en desarrollo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Este reporte estará disponible próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

