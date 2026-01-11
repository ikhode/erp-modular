import React, {useEffect, useState} from 'react';
import {CreditCard as Edit, DollarSign, Plus, Search, Trash2, TrendingDown, TrendingUp} from 'lucide-react';
import {cashFlowStorage} from '../lib/storage';
import {CashFlow} from '../lib/db';

const Expenses: React.FC = () => {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadCashFlows();
  }, []);

  const loadCashFlows = async () => {
    try {
      const data = await cashFlowStorage.getAll();
      setCashFlows(
        data.map(cf => ({
          ...cf,
          createdAt: new Date(cf.createdAt),
          updatedAt: new Date(cf.updatedAt)
        }))
      );
    } catch (error) {
      console.error('Error loading cash flows:', error);
    }
  };

  const handleEdit = (cashFlow: CashFlow) => {
    setEditingCashFlow(cashFlow);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await cashFlowStorage.delete(id);
        setCashFlows(cashFlows.filter(cf => cf.id !== id));
      } catch (error) {
        console.error('Error deleting cash flow:', error);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
  };

  const filteredCashFlows = cashFlows.filter(cashFlow => {
    const matchesSearch = cashFlow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cashFlow.sourceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || cashFlow.movementType === selectedType;
    return matchesSearch && matchesType;
  });

  const totalIncome = cashFlows.filter(cf => cf.movementType === 'ingreso')
                             .reduce((sum, cf) => sum + cf.amount, 0);
  const totalExpenses = cashFlows.filter(cf => cf.movementType === 'egreso')
                               .reduce((sum, cf) => sum + cf.amount, 0);
  const totalWithdrawals = cashFlows.filter(cf => cf.movementType === 'egreso' && cf.sourceType === 'gasto')
                                  .reduce((sum, cf) => sum + cf.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ingreso': return 'bg-green-100 text-green-800';
      case 'egreso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ingreso': return TrendingUp;
      case 'egreso': return TrendingDown;
      default: return DollarSign;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX');
  };

  const types = [
    { value: 'all', label: 'Todos' },
    { value: 'ingreso', label: 'Ingresos' },
    { value: 'egreso', label: 'Gastos' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gastos y Finanzas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Gastos</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Retiros</p>
              <p className="text-2xl font-bold text-orange-600">${totalWithdrawals.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className={`h-8 w-8 mr-3 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-sm text-gray-600">Utilidad Neta</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={handleTypeChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCashFlows.map((cashFlow) => {
                const TypeIcon = getTypeIcon(cashFlow.movementType);
                return (
                  <tr key={cashFlow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cashFlow.description}</div>
                        {cashFlow.referenceType && cashFlow.referenceId && (
                          <div className="text-sm text-gray-500">
                            Ref: {cashFlow.referenceType} #{cashFlow.referenceId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(cashFlow.movementType)}`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {cashFlow.movementType === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashFlow.sourceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${
                        cashFlow.movementType === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cashFlow.movementType === 'ingreso' ? '+' : '-'}${cashFlow.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cashFlow.paymentMethod || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(cashFlow.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(cashFlow)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => cashFlow.id && handleDelete(cashFlow.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCashFlow ? 'Editar Registro' : 'Nuevo Registro'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidad completa del modal en desarrollo...
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingCashFlow(null);
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

