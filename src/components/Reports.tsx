import React, {useEffect, useState} from 'react';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Factory,
    FileText,
    Filter,
    Package,
    PieChart,
    RefreshCw,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    XCircle
} from 'lucide-react';
import {storage} from '../lib/storage';
import {CashFlow, Compra, Empleado, Inventario, Proceso, ProduccionTicket, Producto, Proveedor, Venta} from '../lib/db';

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
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [procesos, setProcesos] = useState<Proceso[]>([]);
    const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
    const [locations, setLocations] = useState<{ id: number; nombre: string }[]>([]);
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
                inventarioData,
                proveedoresData,
                procesosData,
                cashFlowsData,
                locationsData
            ] = await Promise.all([
                storage.ventas.getAll(),
                storage.compras.getAll(),
                storage.produccionTickets.getAll(),
                storage.empleados.getAll(),
                storage.productos.getAll(),
                storage.inventario.getAll(),
                storage.proveedores.getAll(),
                storage.procesos.getAll(),
                storage.cashFlow.getAll(),
                storage.ubicaciones.getAll()
            ]);

            setVentas(ventasData.map(v => ({ ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) })));
            setCompras(comprasData.map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })));
            setProduccion(produccionData.map(p => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })));
            setEmpleados(empleadosData);
            setProductos(productosData);
            setInventario(inventarioData);
            setProveedores(proveedoresData);
            setProcesos(procesosData);
            setCashFlows(cashFlowsData.map(cf => ({ ...cf, createdAt: new Date(cf.createdAt), updatedAt: new Date(cf.updatedAt) })));
            setLocations(locationsData.map(loc => ({ id: loc.id || 0, nombre: loc.nombre || '' })));
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

    const exportToCSV = (data: unknown[], filename: string) => {
        setExporting(true);
        try {
            const headers = Object.keys(data[0] || {});
            const csvContent = [
                headers.join(','),
                ...data.map((row: unknown) =>
                    headers.map((header: string) => JSON.stringify((row as Record<string, unknown>)[header] || '')).join(',')
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
        const totalProducido = filteredProduccion.reduce((sum, p) => sum + (p.cantidadProducida || 0), 0);
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

    const renderPurchasesReport = () => {
        const filteredCompras = filterDataByDate(compras);
        const totalPurchases = filteredCompras.reduce((sum, c) => sum + (c.totalAmount || (c.cantidad * c.precioUnitario)), 0);
        const totalTransactions = filteredCompras.length;
        const avgTicket = totalTransactions > 0 ? totalPurchases / totalTransactions : 0;

        return (
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <Package className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Compras Totales</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalPurchases)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
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
                        <Users className="h-8 w-8 text-orange-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Proveedores</p>
                            <p className="text-2xl font-bold">{new Set(filteredCompras.map(c => c.proveedorId)).size}</p>
                        </div>
                    </div>
                </div>

                {/* Análisis Detallado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Compras por Producto</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {productos.map(producto => {
                                const productPurchases = filteredCompras.filter(c => c.productoId === producto.id);
                                const quantity = productPurchases.reduce((sum, c) => sum + c.cantidad, 0);
                                const revenue = productPurchases.reduce((sum, c) => sum + (c.totalAmount || (c.cantidad * c.precioUnitario)), 0);

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
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Compras por Proveedor</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Array.from(new Set(filteredCompras.map(c => c.proveedorId))).map(proveedorId => {
                                const proveedor = proveedores.find(p => p.id === proveedorId);
                                const providerPurchases = filteredCompras.filter(c => c.proveedorId === proveedorId);
                                const total = providerPurchases.reduce((sum, c) => sum + (c.totalAmount || (c.cantidad * c.precioUnitario)), 0);

                                return total > 0 ? (
                                    <div key={proveedorId} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{proveedor?.nombre || 'Proveedor no encontrado'}</p>
                                            <p className="text-sm text-gray-600">{providerPurchases.length} compras</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(total)}</p>
                                        </div>
                                    </div>
                                ) : null;
                            }).filter(Boolean)}
                        </div>
                    </div>
                </div>

                {/* Tabla de Compras Detalladas */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Transacciones Recientes</h4>
                            <button
                                onClick={() => exportToCSV(filteredCompras, 'reporte_compras')}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCompras.slice(0, 10).map((compra) => {
                                    const producto = productos.find(p => p.id === compra.productoId);
                                    const proveedor = proveedores.find(p => p.id === compra.proveedorId);
                                    return (
                                        <tr key={compra.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(compra.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {producto?.nombre || 'Producto no encontrado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {proveedor?.nombre || 'Proveedor no encontrado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {compra.cantidad}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(compra.precioUnitario)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(compra.totalAmount || (compra.cantidad * compra.precioUnitario))}
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

    const renderProductionReport = () => {
        const filteredProduccion = filterDataByDate(produccion);
        const totalProduced = filteredProduccion.reduce((sum, p) => sum + (p.cantidadProducida || 0), 0);
        const totalTickets = filteredProduccion.length;
        const completedTickets = filteredProduccion.filter(p => p.estado === 'completado').length;
        const efficiency = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

        // Métricas avanzadas
        const avgProductionPerTicket = totalTickets > 0 ? totalProduced / totalTickets : 0;
        const productionByProcess = procesos.map(proceso => {
            const processTickets = filteredProduccion.filter(p => p.processId === proceso.id);
            const total = processTickets.reduce((sum, p) => sum + (p.cantidadProducida || 0), 0);
            const completed = processTickets.filter(p => p.estado === 'completado').length;
            const efficiency = processTickets.length > 0 ? (completed / processTickets.length) * 100 : 0;
            return { proceso, total, tickets: processTickets.length, efficiency };
        }).filter(item => item.tickets > 0);

        const productionByEmployee = Array.from(new Set(filteredProduccion.map(p => p.employeeId))).map(empleadoId => {
            const empleado = empleados.find(e => e.id === empleadoId);
            const employeeTickets = filteredProduccion.filter(p => p.employeeId === empleadoId);
            const total = employeeTickets.reduce((sum, p) => sum + (p.cantidadProducida || 0), 0);
            const completed = employeeTickets.filter(p => p.estado === 'completado').length;
            const efficiency = employeeTickets.length > 0 ? (completed / employeeTickets.length) * 100 : 0;
            return { empleado, total, tickets: employeeTickets.length, efficiency };
        }).filter(item => item.tickets > 0);

        // Tendencia semanal
        const weeklyTrend: { date: string; production: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayProduction = filteredProduccion.filter(p => {
                const pDate = new Date(p.createdAt);
                return pDate.toDateString() === date.toDateString();
            }).reduce((sum, p) => sum + (p.cantidadProducida || 0), 0);
            weeklyTrend.push({ date: date.toLocaleDateString('es-MX', { weekday: 'short' }), production: dayProduction });
        }

        // Análisis de cuellos de botella
        const bottlenecks = productionByProcess.filter(p => p.efficiency < 70).sort((a, b) => a.efficiency - b.efficiency);

        return (
            <div className="space-y-6">
                {/* KPIs Avanzados */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <Factory className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Producción Total</p>
                            <p className="text-2xl font-bold">{totalProduced.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Tickets Totales</p>
                            <p className="text-2xl font-bold">{totalTickets}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Eficiencia Global</p>
                            <p className="text-2xl font-bold">{efficiency.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <Target className="h-8 w-8 text-orange-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Promedio por Ticket</p>
                            <p className="text-2xl font-bold">{avgProductionPerTicket.toFixed(1)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Cuellos de Botella</p>
                            <p className="text-2xl font-bold">{bottlenecks.length}</p>
                        </div>
                    </div>
                </div>

                {/* Tendencia Semanal */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Producción Semanal</h4>
                    <div className="space-y-3">
                        {weeklyTrend.map((day, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 w-16">{day.date}</span>
                                <div className="flex-1 mx-4">
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((day.production / Math.max(...weeklyTrend.map(d => d.production))) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{day.production}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Eficiencia por Proceso */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Eficiencia por Proceso</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {productionByProcess.map((item) => (
                                <div key={item.proceso.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.proceso.nombre}</p>
                                        <p className="text-sm text-gray-600">{item.tickets} tickets • {item.total} unidades</p>
                                    </div>
                                    <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                            item.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                    }`}>
                      {item.efficiency.toFixed(1)}%
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Productividad por Empleado */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Productividad por Empleado</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {productionByEmployee.map((item) => (
                                <div key={item.empleado?.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.empleado?.nombre || 'Empleado no encontrado'}</p>
                                        <p className="text-sm text-gray-600">{item.tickets} tickets • {item.total} unidades</p>
                                    </div>
                                    <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                            item.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                    }`}>
                      {item.efficiency.toFixed(1)}%
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cuellos de Botella */}
                {bottlenecks.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Cuellos de Botella Identificados</h4>
                        <div className="space-y-3">
                            {bottlenecks.map((item) => (
                                <div key={item.proceso.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div>
                                        <p className="font-medium text-red-800">{item.proceso.nombre}</p>
                                        <p className="text-sm text-red-600">{item.tickets} tickets • Eficiencia baja</p>
                                    </div>
                                    <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {item.efficiency.toFixed(1)}%
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabla de Tickets de Producción */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Tickets de Producción Recientes</h4>
                            <button
                                onClick={() => exportToCSV(filteredProduccion, 'reporte_produccion')}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProduccion.slice(0, 10).map((ticket) => {
                                    const proceso = procesos.find(p => p.id === ticket.processId);
                                    const empleado = empleados.find(e => e.id === ticket.employeeId);
                                    return (
                                        <tr key={ticket.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(ticket.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {proceso?.nombre || 'Proceso no encontrado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {empleado?.nombre || 'Empleado no encontrado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {ticket.cantidadProducida}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              ticket.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                  ticket.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                                      'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ticket.estado === 'completado' ? 'Completado' :
                                ticket.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {ticket.paidAt ? 'Sí' : 'No'}
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

    const renderEmployeesReport = () => {
        const filteredEmpleados = empleados.filter(emp => filters.employee === 'all' || emp.id === parseInt(filters.employee));

        // Calcular métricas de empleados
        const totalEmpleados = filteredEmpleados.length;
        const empleadosActivos = filteredEmpleados.filter(emp => emp.activo).length;
        const empleadosInactivos = totalEmpleados - empleadosActivos;

        // Productividad por empleado
        const productividadPorEmpleado = filteredEmpleados.map(emp => {
            const produccionEmpleado = produccion.filter(p => p.employeeId === emp.id && filterDataByDate([p]).length > 0);
            const totalProducido = produccionEmpleado.reduce((sum, p) => sum + p.cantidadProducida, 0);
            const ticketsCompletados = produccionEmpleado.filter(p => p.estado === 'completado').length;
            const ticketsPagados = produccionEmpleado.filter(p => p.paidAt).length;

            return {
                empleado: emp,
                totalProducido,
                ticketsCompletados,
                ticketsPagados,
                eficiencia: ticketsCompletados > 0 ? (ticketsPagados / ticketsCompletados) * 100 : 0
            };
        });

        return (
            <div className="space-y-6">
                {/* KPIs de Empleados */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Empleados</p>
                                <p className="text-2xl font-bold text-blue-600">{totalEmpleados}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Empleados Activos</p>
                                <p className="text-2xl font-bold text-green-600">{empleadosActivos}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Empleados Inactivos</p>
                                <p className="text-2xl font-bold text-red-600">{empleadosInactivos}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Eficiencia Promedio</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {productividadPorEmpleado.length > 0
                                        ? (productividadPorEmpleado.reduce((sum, p) => sum + p.eficiencia, 0) / productividadPorEmpleado.length).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                            <Target className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Tabla de Productividad por Empleado */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Productividad por Empleado</h3>
                            <button
                                onClick={() => exportToCSV(productividadPorEmpleado, 'reporte_productividad_empleados')}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Producido</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Completados</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Pagados</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eficiencia de Pago</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {productividadPorEmpleado.map((prod) => (
                                    <tr key={prod.empleado.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{prod.empleado.nombre}</div>
                                                    <div className="text-sm text-gray-500">ID: {prod.empleado.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {prod.empleado.rol || 'Sin asignar'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {prod.totalProducido}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {prod.ticketsCompletados}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {prod.ticketsPagados}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            prod.eficiencia >= 80 ? 'bg-green-100 text-green-800' :
                                prod.eficiencia >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                        }`}>
                          {prod.eficiencia.toFixed(1)}%
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInventoryReport = () => {
        const filteredInventario = inventario.filter(inv => filters.product === 'all' || inv.productoId === parseInt(filters.product));

        // Calcular métricas de inventario
        const totalItems = filteredInventario.length;
        const totalStock = filteredInventario.reduce((sum, inv) => sum + inv.cantidad, 0);
        const stockBajo = filteredInventario.filter(inv => inv.cantidad <= 10).length;
        const valorTotalInventario = filteredInventario.reduce((sum, inv) => {
            const producto = productos.find(p => p.id === inv.productoId);
            return sum + (inv.cantidad * (producto?.precioCompra || 0));
        }, 0);

        // Inventario por producto
        const inventarioPorProducto = productos.map(producto => {
            const registrosInventario = filteredInventario.filter(inv => inv.productoId === producto.id);
            const totalCantidad = registrosInventario.reduce((sum, inv) => sum + inv.cantidad, 0);
            const ubicacionesProducto = registrosInventario.map(inv => {
                const ubicacion = locations?.find(u => u.id === inv.ubicacionId);
                return { ubicacion: ubicacion?.nombre || 'Desconocida', cantidad: inv.cantidad };
            });

            return {
                producto,
                totalCantidad,
                ubicaciones: ubicacionesProducto,
                valorTotal: totalCantidad * (producto.precioCompra || 0)
            };
        }).filter(item => item.totalCantidad > 0);

        return (
            <div className="space-y-6">
                {/* KPIs de Inventario */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Stock Total</p>
                                <p className="text-2xl font-bold text-green-600">{totalStock.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Stock Bajo</p>
                                <p className="text-2xl font-bold text-yellow-600">{stockBajo}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Valor Total</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(valorTotalInventario)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Tabla de Inventario por Producto */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Inventario por Producto</h3>
                            <button
                                onClick={() => exportToCSV(inventarioPorProducto, 'reporte_inventario')}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicaciones</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {inventarioPorProducto.map((item) => (
                                    <tr key={item.producto.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{item.producto.nombre}</div>
                                                    <div className="text-sm text-gray-500">{item.producto.unidad}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.totalCantidad}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="space-y-1">
                                                {item.ubicaciones.map((ubic, idx) => (
                                                    <div key={idx} className="text-xs">
                                                        {ubic.ubicacion}: {ubic.cantidad}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(item.valorTotal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.totalCantidad <= 5 ? 'bg-red-100 text-red-800' :
                                item.totalCantidad <= 10 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                        }`}>
                          {item.totalCantidad <= 5 ? 'Crítico' :
                              item.totalCantidad <= 10 ? 'Bajo' : 'Normal'}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinancialReport = () => {
        const filteredVentas = filterDataByDate(ventas);
        const filteredCompras = filterDataByDate(compras);
        const filteredCashFlow = filterDataByDate(cashFlows);

        // Calcular métricas financieras
        const ingresosVentas = filteredVentas.reduce((sum, v) => sum + (v.totalAmount || (v.cantidad * v.precioUnitario)), 0);
        const costosCompras = filteredCompras.reduce((sum, c) => sum + (c.totalAmount || (c.cantidad * c.precioUnitario)), 0);
        const otrosIngresos = filteredCashFlow.filter(cf => cf.movementType === 'ingreso' && cf.sourceType !== 'venta')
            .reduce((sum, cf) => sum + cf.amount, 0);
        const otrosGastos = filteredCashFlow.filter(cf => cf.movementType === 'egreso' && cf.sourceType !== 'compra')
            .reduce((sum, cf) => sum + cf.amount, 0);

        const ingresosTotales = ingresosVentas + otrosIngresos;
        const gastosTotales = costosCompras + otrosGastos;
        const utilidadNeta = ingresosTotales - gastosTotales;
        const margenNeto = ingresosTotales > 0 ? (utilidadNeta / ingresosTotales) * 100 : 0;

        // Flujo de caja por mes
        const flujoPorMes: { mes: string; ingresos: number; gastos: number; flujoNeto: number }[] = [];
        const fechaInicio = new Date(filters.dateFrom);
        const fechaFin = new Date(filters.dateTo);

        for (let d = new Date(fechaInicio); d <= fechaFin; d.setMonth(d.getMonth() + 1)) {
            const mes = d.getMonth();
            const year = d.getFullYear();

            const ingresosMes = filteredCashFlow.filter(cf =>
                cf.movementType === 'ingreso' &&
                new Date(cf.createdAt).getMonth() === mes &&
                new Date(cf.createdAt).getFullYear() === year
            ).reduce((sum, cf) => sum + cf.amount, 0);

            const gastosMes = filteredCashFlow.filter(cf =>
                cf.movementType === 'egreso' &&
                new Date(cf.createdAt).getMonth() === mes &&
                new Date(cf.createdAt).getFullYear() === year
            ).reduce((sum, cf) => sum + cf.amount, 0);

            flujoPorMes.push({
                mes: d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' }),
                ingresos: ingresosMes,
                gastos: gastosMes,
                flujoNeto: ingresosMes - gastosMes
            });
        }

        return (
            <div className="space-y-6">
                {/* KPIs Financieros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ingresos Totales</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(ingresosTotales)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Gastos Totales</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(gastosTotales)}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Utilidad Neta</p>
                                <p className={`text-2xl font-bold ${utilidadNeta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(utilidadNeta)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Margen Neto</p>
                                <p className="text-2xl font-bold text-purple-600">{margenNeto.toFixed(1)}%</p>
                            </div>
                            <PieChart className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Estado de Resultados */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Estado de Resultados</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium">Ingresos por Ventas</span>
                                <span className="text-green-600">{formatCurrency(ingresosVentas)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium">Otros Ingresos</span>
                                <span className="text-green-600">{formatCurrency(otrosIngresos)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b font-semibold">
                                <span>Ingresos Totales</span>
                                <span className="text-green-600">{formatCurrency(ingresosTotales)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium">Costos de Compras</span>
                                <span className="text-red-600">({formatCurrency(costosCompras)})</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium">Otros Gastos</span>
                                <span className="text-red-600">({formatCurrency(otrosGastos)})</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b font-semibold">
                                <span>Gastos Totales</span>
                                <span className="text-red-600">({formatCurrency(gastosTotales)})</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t-2 border-b-2 font-bold text-lg">
                                <span>Utilidad Neta</span>
                                <span className={utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(utilidadNeta)}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flujo de Caja por Mes */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Flujo de Caja Mensual</h3>
                            <button
                                onClick={() => exportToCSV(flujoPorMes, 'reporte_flujo_caja')}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flujo Neto</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {flujoPorMes.map((mes, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {mes.mes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            {formatCurrency(mes.ingresos)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            {formatCurrency(mes.gastos)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={mes.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(mes.flujoNeto)}
                        </span>
                                        </td>
                                    </tr>
                                ))}
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
                    {selectedReport === 'compras' && renderPurchasesReport()}
                    {selectedReport === 'produccion' && renderProductionReport()}
                    {selectedReport === 'empleados' && renderEmployeesReport()}
                    {selectedReport === 'inventario' && renderInventoryReport()}
                    {selectedReport === 'financiero' && renderFinancialReport()}
                </div>
            </div>
        </div>
    );
};

export default Reports;

