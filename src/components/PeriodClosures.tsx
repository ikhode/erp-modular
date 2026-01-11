import React, {useCallback, useEffect, useState} from 'react';
import {AlertTriangle, Calendar, CheckCircle, FileText, Lock, Unlock} from 'lucide-react';
import {storage} from '../lib/storage';

interface PeriodClosure {
  id?: number;
  period: string; // YYYY-MM
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'processing';
  closedBy?: string;
  closedAt?: string;
  totalSales: number;
  totalPurchases: number;
  totalProduction: number;
  inventoryValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PeriodClosures: React.FC = () => {
  const [periodClosures, setPeriodClosures] = useState<PeriodClosure[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodClosure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPeriodClosures = useCallback(async () => {
    try {
      // For now, we'll simulate period closures data
      // In a real implementation, this would come from a dedicated storage
      const currentDate = new Date();
      const periods: PeriodClosure[] = [];

      // Generate last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const existingPeriod = periodClosures.find(p => p.period === periodKey);
        if (existingPeriod) {
          periods.push(existingPeriod);
        } else {
          // Calculate period data
          const periodData = await calculatePeriodData(periodKey);
          periods.push(periodData);
        }
      }

      setPeriodClosures(periods);
    } catch (error) {
      console.error('Error loading period closures:', error);
    }
  }, [periodClosures]);

  useEffect(() => {
    loadPeriodClosures();
  }, [loadPeriodClosures]);

  const calculatePeriodData = async (period: string): Promise<PeriodClosure> => {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    try {
      // Get sales for the period
      const sales = await storage.ventas.getAll();
      const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt!);
        return saleDate >= startDate && saleDate <= endDate && sale.estado === 'entregado';
      });

      // Get purchases for the period
      const purchases = await storage.compras.getAll();
      const periodPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.createdAt!);
        return purchaseDate >= startDate && purchaseDate <= endDate && purchase.estado === 'completado';
      });

      // Get production for the period
      const production = await storage.produccionTickets.getAll();
      const periodProduction = production.filter(prod => {
        const prodDate = new Date(prod.createdAt!);
        return prodDate >= startDate && prodDate <= endDate && prod.estado === 'completado';
      });

      // Calculate inventory value
      const inventory = await storage.inventario.getAll();
      const inventoryValue = inventory.reduce((total, item) => {
        // This would need product pricing logic
        return total + (item.cantidad * 10); // Placeholder pricing
      }, 0);

      const totalSales = periodSales.reduce((sum, sale) => sum + (sale.cantidad * sale.precioUnitario * 1.16), 0);
      const totalPurchases = periodPurchases.reduce((sum, purchase) => sum + (purchase.cantidad * purchase.precioUnitario), 0);
      const totalProduction = periodProduction.length;

      return {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'open',
        totalSales,
        totalPurchases,
        totalProduction,
        inventoryValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating period data:', error);
      return {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'open',
        totalSales: 0,
        totalPurchases: 0,
        totalProduction: 0,
        inventoryValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  };

  const handleClosePeriod = async (periodClosure: PeriodClosure) => {
    if (periodClosure.status === 'closed') {
      alert('Este período ya está cerrado.');
      return;
    }

    if (!confirm(`¿Está seguro de cerrar el período ${periodClosure.period}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // Update period status
      const updatedPeriod = {
        ...periodClosure,
        status: 'closed' as const,
        closedBy: 'Usuario Actual', // TODO: Get from user context
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real implementation, save to storage
      setPeriodClosures(prev =>
        prev.map(p => p.period === periodClosure.period ? updatedPeriod : p)
      );

      alert(`Período ${periodClosure.period} cerrado exitosamente.`);
    } catch (error) {
      console.error('Error closing period:', error);
      alert('Error al cerrar el período.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = (periodClosure: PeriodClosure) => {
    setSelectedPeriod(periodClosure);
    setShowModal(true);
  };

  const generatePeriodReport = (periodClosure: PeriodClosure) => {
    const report = `
PERÍODO: ${periodClosure.period}
FECHA DE CIERRE: ${periodClosure.closedAt || 'No cerrado'}
CERRADO POR: ${periodClosure.closedBy || 'N/A'}

RESUMEN FINANCIERO:
==================
Ventas Totales: $${periodClosure.totalSales.toLocaleString()}
Compras Totales: $${periodClosure.totalPurchases.toLocaleString()}
Producción: ${periodClosure.totalProduction} tickets
Valor de Inventario: $${periodClosure.inventoryValue.toLocaleString()}

MARGEN BRUTO: $${(periodClosure.totalSales - periodClosure.totalPurchases).toLocaleString()}

NOTAS: ${periodClosure.notes || 'Sin notas adicionales'}
    `.trim();

    // Create and download text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_periodo_${periodClosure.period}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed':
        return <Lock className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Unlock className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'closed':
        return 'Cerrado';
      case 'processing':
        return 'Procesando';
      default:
        return 'Abierto';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cierres de Período</h1>
        <div className="text-sm text-gray-600">
          Gestión de cierres contables por período mensual
        </div>
      </div>

      {/* Period Closures Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periodClosures.map((period) => (
                <tr key={period.period} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(period.startDate).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {period.startDate} - {period.endDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                      {getStatusIcon(period.status)}
                      <span className="ml-1">{getStatusLabel(period.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${period.totalSales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${period.totalPurchases.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.totalProduction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${period.inventoryValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewReport(period)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver reporte"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      {period.status === 'open' && (
                        <button
                          onClick={() => handleClosePeriod(period)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Cerrar período"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      {period.status === 'closed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Report Modal */}
      {showModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reporte del Período {selectedPeriod.period}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Período</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPeriod.startDate).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPeriod.status)}`}>
                    {getStatusIcon(selectedPeriod.status)}
                    <span className="ml-1">{getStatusLabel(selectedPeriod.status)}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ventas Totales</label>
                  <p className="text-sm text-gray-900">${selectedPeriod.totalSales.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compras Totales</label>
                  <p className="text-sm text-gray-900">${selectedPeriod.totalPurchases.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producción</label>
                  <p className="text-sm text-gray-900">{selectedPeriod.totalProduction} tickets</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Inventario</label>
                  <p className="text-sm text-gray-900">${selectedPeriod.inventoryValue.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Margen Bruto</label>
                <p className={`text-lg font-bold ${(selectedPeriod.totalSales - selectedPeriod.totalPurchases) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(selectedPeriod.totalSales - selectedPeriod.totalPurchases).toLocaleString()}
                </p>
              </div>

              {selectedPeriod.closedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cerrado por</label>
                  <p className="text-sm text-gray-900">
                    {selectedPeriod.closedBy} el {new Date(selectedPeriod.closedAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => generatePeriodReport(selectedPeriod)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Descargar Reporte
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Procesando cierre de período...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodClosures;
