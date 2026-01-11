import React, {useCallback, useEffect, useState} from 'react';
import {AlertTriangle, Package, Plus, Search, TrendingDown, TrendingUp} from 'lucide-react';
import {storage} from '../lib/storage';
import {Inventario, Producto} from '../lib/db';
import ProductFormModal from './ProductFormModal';

const Inventory: React.FC = () => {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [inventarioData, productosData] = await Promise.all([
        storage.inventario.getAll(),
        storage.productos.getAll(),
      ]);

      // Si no hay datos, crear datos de prueba
      if (productosData.length === 0) {
        console.log('No hay productos, creando datos de prueba...');
        await createTestData();
        // Recargar después de crear datos
        const [newInventarioData, newProductosData] = await Promise.all([
          storage.inventario.getAll(),
          storage.productos.getAll(),
        ]);
        setInventario(newInventarioData);
        setProductos(newProductosData);
      } else {
        setInventario(inventarioData);
        setProductos(productosData);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createTestData = async () => {
    try {
      // Crear tipos de lugar
      await storage.locationTypes.add({
        name: 'Patio',
        description: 'Áreas exteriores para almacenamiento de materia prima',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await storage.locationTypes.add({
        name: 'Almacén',
        description: 'Áreas interiores para almacenamiento de productos',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Crear ubicaciones
      const patio1Id = await storage.ubicaciones.add({
        nombre: 'Patio Norte',
        tipo: 'Patio',
        descripcion: 'Patio principal para recepción de materia prima',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const almacen1Id = await storage.ubicaciones.add({
        nombre: 'Almacén Central',
        tipo: 'Almacén',
        descripcion: 'Almacén principal para productos terminados',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Crear productos
      const cocoProductoId = await storage.productos.add({
        nombre: 'Coco Bueno',
        descripcion: 'Coco de primera calidad',
        precioMin: 5.00,
        precioMax: 8.00,
        precioActual: 6.50,
        unidad: 'kg',
        compra: true,
        venta: false,
        procesoEntrada: true,
        procesoSalida: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const pulpaProductoId = await storage.productos.add({
        nombre: 'Pulpa de Coco',
        descripcion: 'Pulpa procesada lista para venta',
        precioMin: 15.00,
        precioMax: 25.00,
        precioActual: 20.00,
        unidad: 'kg',
        compra: false,
        venta: true,
        procesoEntrada: false,
        procesoSalida: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Crear registros de inventario
      await storage.inventario.add({
        productoId: cocoProductoId,
        ubicacionId: patio1Id,
        cantidad: 150,
        minimo: 50,
        maximo: 500,
        proveedor: 'Proveedor ABC',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await storage.inventario.add({
        productoId: pulpaProductoId,
        ubicacionId: almacen1Id,
        cantidad: 25,
        minimo: 10,
        maximo: 200,
        proveedor: 'Sin proveedor',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Datos de prueba creados exitosamente!');
    } catch (error) {
      console.error('Error creando datos de prueba:', error);
    }
  };

  const getProducto = (id: number) => productos.find(p => p.id === id);

  const filteredInventory = inventario.filter(item => {
    const producto = getProducto(item.productoId);
    const matchesSearch = producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStockStatus = (item: Inventario) => {
    if (item.cantidad <= item.minimo) {
      return { status: 'critical', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (item.cantidad <= item.minimo * 1.2) {
      return { status: 'low', color: 'text-yellow-600 bg-yellow-100', icon: TrendingDown };
    } else {
      return { status: 'good', color: 'text-green-600 bg-green-100', icon: TrendingUp };
    }
  };

  const totalValue = inventario.reduce((sum, item) => {
    const producto = getProducto(item.productoId);
    return sum + (item.cantidad * (producto?.precioActual || 0));
  }, 0);
  const lowStockItems = inventario.filter(item => item.cantidad <= item.minimo).length;
  const criticalItems = inventario.filter(item => item.cantidad <= item.minimo * 0.5).length;

  const handleProductCreated = (producto: Producto & { id: number }) => {
    setProductos([...productos, producto]);
    // Recargar inventario después de crear producto
    loadData();
    setShowProductModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => setShowProductModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
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
              <p className="text-2xl font-bold">{inventario.length}</p>
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
                const producto = getProducto(item.productoId);
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{producto?.nombre}</div>
                        <div className="text-sm text-gray-500">ID: {item.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Sin categoría
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.cantidad} {producto?.unidad}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minimo} | Max: {item.maximo}
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
                      ${(producto?.precioActual || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(item.cantidad * (producto?.precioActual || 0)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.proveedor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductModal && (
        <ProductFormModal
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          onCreated={handleProductCreated}
        />
      )}
    </div>
  );
};

export default Inventory;