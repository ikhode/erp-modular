import React, { useState } from 'react';
import { DollarSign, Plus, CreditCard as Edit, Trash2, Search, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income' | 'withdrawal';
  date: string;
  relatedTo?: string;
  relatedType?: 'product' | 'process' | 'employee';
  receipt?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Compra de materia prima',
      amount: 5000,
      category: 'Materiales',
      type: 'expense',
      date: '2024-01-15',
      relatedTo: 'Coco fresco',
      relatedType: 'product',
      status: 'approved',
      approvedBy: 'Admin',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      description: 'Venta de productos',
      amount: 8500,
      category: 'Ventas',
      type: 'income',
      date: '2024-01-15',
      status: 'approved',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      description: 'Pago de nómina',
      amount: 15000,
      category: 'Nómina',
      type: 'expense',
      date: '2024-01-14',
      status: 'approved',
      approvedBy: 'Admin',
      createdAt: '2024-01-14'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const categories = [
    'Materiales', 'Nómina', 'Servicios', 'Mantenimiento', 
    'Transporte', 'Ventas', 'Otros'
  ];

  const types = [
    { value: 'all', label: 'Todos' },
    { value: 'expense', label: 'Gastos' },
    { value: 'income', label: 'Ingresos' },
    { value: 'withdrawal', label: 'Retiros' }
  ];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || expense.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalIncome = expenses.filter(e => e.type === 'income' && e.status === 'approved')
                             .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense' && e.status === 'approved')
                               .reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = expenses.filter(e => e.type === 'withdrawal' && e.status === 'approved')
                                  .reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalIncome - totalExpenses - totalWithdrawals;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'withdrawal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return TrendingUp;
      case 'expense': return TrendingDown;
      case 'withdrawal': return DollarSign;
      default: return DollarSign;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
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
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
              {filteredExpenses.map((expense) => {
                const TypeIcon = getTypeIcon(expense.type);
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                        {expense.relatedTo && (
                          <div className="text-sm text-gray-500">
                            Relacionado: {expense.relatedTo} ({expense.relatedType})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(expense.type)}`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {expense.type === 'income' ? 'Ingreso' : 
                         expense.type === 'expense' ? 'Gasto' : 'Retiro'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${
                        expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {expense.type === 'income' ? '+' : '-'}${expense.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {expense.status === 'approved' ? 'Aprobado' :
                         expense.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
              {editingExpense ? 'Editar Registro' : 'Nuevo Registro'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidad completa del modal en desarrollo...
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingExpense(null);
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