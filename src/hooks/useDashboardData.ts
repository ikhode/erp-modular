import {useCallback, useState} from 'react';
import {DollarSign, Package, TrendingUp, Users} from 'lucide-react';
import {storage} from '../lib/storage';

interface StatItem {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend: 'up' | 'down' | 'stable';
    change: string;
}

export const useDashboardData = () => {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const calcularTendencia = (actual: number, anterior: number) => {
        if (anterior === 0) return actual > 0 ? 'up' : 'stable';
        const cambio = ((actual - anterior) / anterior) * 100;
        if (cambio > 5) return 'up';
        if (cambio < -5) return 'down';
        return 'stable';
    };

    const calcularCambio = (actual: number, anterior: number) => {
        if (anterior === 0) return actual > 0 ? '+100%' : '0%';
        const cambio = ((actual - anterior) / anterior) * 100;
        return `${cambio >= 0 ? '+' : ''}${cambio.toFixed(1)}%`;
    };

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // Cargar empleados activos
            const empleados = await storage.empleados.getAll();
            const empleadosActivos = empleados.filter(emp => emp.activo !== false).length;

            // Cargar ventas del día
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const ventas = await storage.ventas.getAll();
            const ventasHoy = ventas.filter(venta => {
                const fechaVenta = new Date(venta.createdAt);
                fechaVenta.setHours(0, 0, 0, 0);
                return fechaVenta.getTime() === hoy.getTime();
            });
            const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + venta.total, 0);

            // Cargar productos en stock
            const inventario = await storage.inventario.getAll();
            const totalProductosStock = inventario.reduce((sum, item) => sum + item.cantidad, 0);

            // Calcular eficiencia general (basada en tickets de producción completados vs totales)
            const produccionTickets = await storage.produccionTickets.getAll();
            const ticketsCompletados = produccionTickets.filter(ticket => ticket.estado === 'completado').length;
            const totalTickets = produccionTickets.length;
            const eficienciaGeneral = totalTickets > 0 ? Math.round((ticketsCompletados / totalTickets) * 100) : 0;

            // Calcular tendencias (comparando con ayer)
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);
            const ventasAyer = ventas.filter(venta => {
                const fechaVenta = new Date(venta.createdAt);
                fechaVenta.setHours(0, 0, 0, 0);
                return fechaVenta.getTime() === ayer.getTime();
            });
            const totalVentasAyer = ventasAyer.reduce((sum, venta) => sum + venta.total, 0);

            const empleadosAyer = empleadosActivos; // Simplificado, en producción calcularía cambios
            const productosAyer = totalProductosStock; // Simplificado

            const newStats: StatItem[] = [
                {
                    title: 'Empleados Activos',
                    value: empleadosActivos.toString(),
                    icon: Users,
                    color: 'bg-blue-500',
                    trend: calcularTendencia(empleadosActivos, empleadosAyer),
                    change: calcularCambio(empleadosActivos, empleadosAyer)
                },
                {
                    title: 'Ventas del Día',
                    value: `$${totalVentasHoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                    icon: DollarSign,
                    color: 'bg-green-500',
                    trend: calcularTendencia(totalVentasHoy, totalVentasAyer),
                    change: calcularCambio(totalVentasHoy, totalVentasAyer)
                },
                {
                    title: 'Productos en Stock',
                    value: totalProductosStock.toLocaleString('es-MX'),
                    icon: Package,
                    color: 'bg-purple-500',
                    trend: calcularTendencia(totalProductosStock, productosAyer),
                    change: calcularCambio(totalProductosStock, productosAyer)
                },
                {
                    title: 'Eficiencia General',
                    value: `${eficienciaGeneral}%`,
                    icon: TrendingUp,
                    color: 'bg-orange-500',
                    trend: eficienciaGeneral >= 80 ? 'up' : eficienciaGeneral >= 60 ? 'stable' : 'down',
                    change: eficienciaGeneral >= 80 ? '+Excelente' : eficienciaGeneral >= 60 ? '+Bueno' : '+Mejorar'
                }
            ];

            setStats(newStats);
            setLastUpdate(new Date());

        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            // Fallback a datos por defecto en caso de error
            setStats([
                { title: 'Empleados Activos', value: '0', icon: Users, color: 'bg-blue-500', trend: 'stable', change: '0%' },
                { title: 'Ventas del Día', value: '$0.00', icon: DollarSign, color: 'bg-green-500', trend: 'stable', change: '0%' },
                { title: 'Productos en Stock', value: '0', icon: Package, color: 'bg-purple-500', trend: 'stable', change: '0%' },
                { title: 'Eficiencia General', value: '0%', icon: TrendingUp, color: 'bg-orange-500', trend: 'stable', change: '0%' }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, lastUpdate, loadDashboardData };
};
