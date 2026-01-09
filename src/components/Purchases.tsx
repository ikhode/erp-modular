import React, { useState } from 'react';
import { ShoppingBag, Plus, CreditCard as Edit, Trash2, Search, Calendar } from 'lucide-react';

interface Purchase {
  id: string;
  date: string;
  supplier: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  invoiceNumber?: string;
  notes?: string;
  receivedBy?: string;
  receivedDate?: string;
}

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: '1',
      date: '2024-01-15',
      supplier: 'Proveedores del Pacífico',
      product: 'Coco Fresco',
      quantity: 500,
      unit: 'kg',
      unitPrice: 15.00,
      totalAmount: 7500.00,
      status: 'received',
      invoiceNumber: 'INV-2024-001',
      receivedBy: 'Carlos López',
      receivedDate: '2024-01-15'
    },
    {
      id: '2',
      date: '2024-01-14',
      supplier: 'Envases Modernos SA',
      product: 'Envases 500g',
      quantity: 1000,
      unit: 'pz',
      unitPrice: 3.50,
      totalAmount: 3500.00,
      status: 'received',
      invoiceNumber: 'INV-2024-002',
      receivedBy: 'Ana Martínez',
      receivedDate: '2024-01-14'
    },
    {
      id: '3',
      date: '2024-01-13',
      supplier: 'Impresiones Rápidas',
      product: 'Etiquetas',
      quantity: 2000,
      unit: 'pz',
      unitPrice: 0.50,
      totalAmount: 1000.00,
      status: 'pending',
      invoiceNumber: 'INV-2024-003'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Recibido';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      setPurchases(purchases.filter(p => p.id !== id));
    }
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingPurchases = purchases.filter(p => p.status === 'pending').length;
  const receivedPurchases = purchases.filter(p => p.status === 'received').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Recibidas</p>
              <p className="text-2xl font-bold">{receivedPurchases}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">{pendingPurchases}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold">${totalPurchases.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar compras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.date}</div>
                      {purchase.invoiceNumber && (
                        <div className="text-sm text-gray-500">{purchase.invoiceNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.quantity} {purchase.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${purchase.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${purchase.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {getStatusLabel(purchase.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidad completa del modal en desarrollo...
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingPurchase(null);
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

export default Purchases;
