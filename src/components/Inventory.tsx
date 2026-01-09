import React, { useState } from 'react';
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  supplier: string;
  lastUpdated: string;
}

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const inventory: InventoryItem[] = [
    {
      id: '1',
      name: 'Coco Fresco',
      category: 'Materia Prima',
      currentStock: 500,
      minStock: 100,
      maxStock: 1000,
      unit: 'kg',
      unitCost: 15.00,
      supplier: 'Proveedores del Pacífico',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      name: 'Coco Rallado 500g',
      category: 'Producto Terminado',
      currentStock: 50,
      minStock: 100,
      maxStock: 500,
      unit: 'piezas',
      unitCost: 25.00,
      supplier: 'Producción Interna',
      lastUpdated: '2024-01-15'
    },
    {
      id: '3',
      name: 'Envases 500g',
      category: 'Empaque',
      currentStock: 200,
      minStock: 150,
      maxStock: 1000,
      unit: 'piezas',
      unitCost: 3.50,
      supplier: 'Envases Modernos SA',
      lastUpdated: '2024-01-14'
    },
    {
      id: '4',
      name: 'Aceite de Coco 250ml',
      category: 'Producto Terminado',
      currentStock: 75,
      minStock: 50,
      maxStock: 300,
      unit: 'piezas',
      unitCost: 80.00,
      supplier: 'Producción Interna',
      lastUpdated: '2024-01-15'
    },
    {
      id: '5',
      name: 'Etiquetas',
      category: 'Empaque',
      currentStock: 500,
      minStock: 200,
      maxStock: 2000,
      unit: 'piezas',
      unitCost: 0.50,
      supplier: 'Impresiones Rápidas',
      lastUpdated: '2024-01-13'
    }
  ];

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'Materia Prima', label: 'Materia Prima' },
    { value: 'Producto Terminado', label: 'Productos Terminados' },
    { value: 'Empaque', label: 'Empaque' },
  ];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) {
      return { status: 'critical', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (item.currentStock <= item.minStock * 1.2) {
      return { status: 'low', color: 'text-yellow-600 bg-yellow-100', icon: TrendingDown };
    } else {
      return { status: 'good', color: 'text-green-600 bg-green-100', icon: TrendingUp };
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;
  const criticalItems = inventory.filter(item => item.currentStock <= item.minStock * 0.5).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold">{lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Críticos</p>
              <p className="text-2xl font-bold">{criticalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">ID: {item.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.status === 'critical' ? 'Crítico' : 
                         stockStatus.status === 'low' ? 'Bajo' : 'Bueno'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(item.currentStock * item.unitCost).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;