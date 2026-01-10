import React, {useEffect, useState} from 'react';
import {CreditCard as Edit, Plus, Search, Trash2} from 'lucide-react';
import {storage} from '../lib/storage';
import type {Producto as ProductoBase} from '../lib/db';
import ProductFormModal from './ProductFormModal';

// Extiende Producto para flags de uso (solo frontend hasta migración)
export type ProductoExtendido = ProductoBase & {
  esComprable?: boolean;
  esVendible?: boolean;
  esConsumible?: boolean;
  esProducible?: boolean;
  tiposLugarPermitidos?: number[]; // IDs de locationTypes permitidos para almacenamiento
};

// Ampliar el modelo Producto para flags de uso
// (esto requiere migración en la base de datos real, aquí se implementa en frontend y se documenta)
const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductoExtendido[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoExtendido | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioMin: '',
    precioMax: '',
    precioActual: '',
    unidad: 'kg',
    tipoProducto: '', // <-- nuevo campo
    esComprable: false,
    esVendible: false,
    esConsumible: false,
    esProducible: false,
    tiposLugarPermitidos: [] as number[],
  });
  const [loading, setLoading] = useState(false);
  const [locationTypes, setLocationTypes] = useState<{ id: number; name: string }[]>([]);
  // Estado para unidades y tipos de producto dinámicos
  const [unidades, setUnidades] = useState(['kg', 'L', 'pz', 'm3']);
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [showNuevaUnidad, setShowNuevaUnidad] = useState(false);
  const [tiposProducto, setTiposProducto] = useState<string[]>([]);
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [showNuevoTipo, setShowNuevoTipo] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductoBase | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchLocationTypes();
    const tipos = JSON.parse(localStorage.getItem('tipos_producto') || '[]');
    setTiposProducto(Array.isArray(tipos) ? tipos : []);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const prods = (await storage.productos.getAll()) as ProductoExtendido[];
    // Leer flags extendidos de localStorage y fusionar
    const prodsWithFlags = prods.map(p => {
      const extendedKey = `producto_flags_${p.nombre}`;
      const flags = localStorage.getItem(extendedKey);
      let tipoProducto;
      try {
        tipoProducto = localStorage.getItem(`producto_tipo_${p.nombre}`) || '';
      } catch { /* ignorar error de localStorage */ }
      let merged = p;
      if (flags) {
        try {
          merged = { ...p, ...JSON.parse(flags) };
        } catch {
          merged = p;
        }
      }
      return { ...merged, tipoProducto };
    });
    setProducts(prodsWithFlags);
    setLoading(false);
  };

  const fetchLocationTypes = async () => {
    const types = await storage.locationTypes.getAll();
    setLocationTypes(types.map(t => ({ id: t.id!, name: t.name })));
  };

  // Al editar, si cambia el nombre, migrar flags en localStorage
  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    setLoading(true);
    // Solo guardar campos válidos en la base de datos
    const productoBase = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precioMin: Number(formData.precioMin),
      precioMax: Number(formData.precioMax),
      precioActual: Number(formData.precioActual),
      unidad: formData.unidad,
      compra: formData.esComprable,
      venta: formData.esVendible,
      procesoEntrada: formData.esConsumible,
      procesoSalida: formData.esProducible,
      createdAt: editingProduct?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    // Si se edita y cambia el nombre, migrar flags en localStorage
    if (editingProduct && editingProduct.nombre !== formData.nombre) {
      const oldKey = `producto_flags_${editingProduct.nombre}`;
      const newKey = `producto_flags_${formData.nombre}`;
      const oldFlags = localStorage.getItem(oldKey);
      if (oldFlags) {
        localStorage.setItem(newKey, oldFlags);
        localStorage.removeItem(oldKey);
      }
      // Migrar tipoProducto
      const oldTipoKey = `producto_tipo_${editingProduct.nombre}`;
      const newTipoKey = `producto_tipo_${formData.nombre}`;
      const oldTipo = localStorage.getItem(oldTipoKey);
      if (oldTipo) {
        localStorage.setItem(newTipoKey, oldTipo);
        localStorage.removeItem(oldTipoKey);
      }
    }
    if (editingProduct) {
      await storage.productos.update(editingProduct.id!, productoBase);
      await storage.syncQueue.add('update', 'productos', { id: editingProduct.id, ...productoBase });
    } else {
      await storage.productos.add(productoBase);
      await storage.syncQueue.add('create', 'productos', { ...productoBase });
    }
    // Guardar flags extendidos en localStorage para persistencia temporal hasta migración
    const extendedKey = `producto_flags_${formData.nombre}`;
    const flags = {
      esComprable: formData.esComprable,
      esVendible: formData.esVendible,
      esConsumible: formData.esConsumible,
      esProducible: formData.esProducible,
      tiposLugarPermitidos: formData.tiposLugarPermitidos,
    };
    localStorage.setItem(extendedKey, JSON.stringify(flags));
    // Guardar tipoProducto en localStorage
    if (formData.tipoProducto) {
      localStorage.setItem(`producto_tipo_${formData.nombre}`, formData.tipoProducto);
    }
    setShowModal(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precioMin: '',
      precioMax: '',
      precioActual: '',
      unidad: 'kg',
      tipoProducto: '', // <-- nuevo campo
      esComprable: false,
      esVendible: false,
      esConsumible: false,
      esProducible: false,
      tiposLugarPermitidos: [] as number[],
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  // Unifica el flujo de creación y edición
  const handleNewProduct = () => {
    setEditProduct(null); // Modo creación
    setShowProductModal(true);
  };
  const handleEdit = (producto: ProductoBase) => {
    setEditProduct(producto); // Modo edición
    setShowProductModal(true);
  };
  const handleProductModalClose = () => {
    setShowProductModal(false);
    setEditProduct(null);
  };
  const handleProductUpdated = async () => {
    await fetchProducts();
    setShowProductModal(false);
    setEditProduct(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const prod = products.find(p => p.id === id);
    if (prod) {
      const extendedKey = `producto_flags_${prod.nombre}`;
      localStorage.removeItem(extendedKey);
    }
    if (confirm('¿Está seguro de eliminar este producto?')) {
      setLoading(true);
      await storage.productos.delete(id);
      await storage.syncQueue.add('delete', 'productos', { id });
      await fetchProducts();
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={handleNewProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
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
      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                      <div className="text-sm text-gray-500">{product.descripcion}</div>
                      <div className="text-xs text-gray-400">ID: {product.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.descripcion}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.unidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Min: ${product.precioMin.toFixed(2)}<br />
                      Max: ${product.precioMax.toFixed(2)}<br />
                      Actual: ${product.precioActual.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Coco Fresco, Aceite de Coco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Descripción del producto"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Mín
                  </label>
                  <input
                    type="number"
                    value={formData.precioMin}
                    onChange={(e) => setFormData({ ...formData, precioMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Máx
                  </label>
                  <input
                    type="number"
                    value={formData.precioMax}
                    onChange={(e) => setFormData({ ...formData, precioMax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Actual
                  </label>
                  <input
                    type="number"
                    value={formData.precioActual}
                    onChange={(e) => setFormData({ ...formData, precioActual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.unidad}
                    onChange={e => {
                      if (e.target.value === '__nueva__') {
                        setShowNuevaUnidad(true);
                      } else {
                        setFormData({ ...formData, unidad: e.target.value });
                        setShowNuevaUnidad(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="__nueva__">+ Crear nueva unidad</option>
                  </select>
                  {showNuevaUnidad && (
                    <input
                      type="text"
                      value={nuevaUnidad}
                      onChange={e => setNuevaUnidad(e.target.value)}
                      placeholder="Nueva unidad"
                      className="w-32 px-2 py-1 border rounded"
                      onBlur={() => {
                        if (nuevaUnidad.trim()) {
                          setUnidades([...unidades, nuevaUnidad]);
                          setFormData({ ...formData, unidad: nuevaUnidad });
                          setShowNuevaUnidad(false);
                          setNuevaUnidad('');
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              {/* Combo box para tipo de producto (si aplica en tu modelo) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de producto
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.tipoProducto || ''}
                    onChange={e => {
                      if (e.target.value === '__nuevo_tipo__') {
                        setShowNuevoTipo(true);
                      } else {
                        setFormData({ ...formData, tipoProducto: e.target.value });
                        setShowNuevoTipo(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona tipo</option>
                    {tiposProducto.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__nuevo_tipo__">+ Crear nuevo tipo</option>
                  </select>
                  {showNuevoTipo && (
                    <input
                      type="text"
                      value={nuevoTipo}
                      onChange={e => setNuevoTipo(e.target.value)}
                      placeholder="Nuevo tipo"
                      className="w-32 px-2 py-1 border rounded"
                      onBlur={() => {
                        if (nuevoTipo.trim()) {
                          setTiposProducto([...tiposProducto, nuevoTipo]);
                          setFormData({ ...formData, tipoProducto: nuevoTipo });
                          setShowNuevoTipo(false);
                          setNuevoTipo('');
                          localStorage.setItem('tipos_producto', JSON.stringify([...tiposProducto, nuevoTipo]));
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usos del producto
                  </label>
                  <div className="flex flex-col space-y-1">
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={formData.esComprable} onChange={e => setFormData({ ...formData, esComprable: e.target.checked })} />
                      <span className="ml-2 text-sm">Se usa en compras</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={formData.esVendible} onChange={e => setFormData({ ...formData, esVendible: e.target.checked })} />
                      <span className="ml-2 text-sm">Se usa en ventas</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={formData.esConsumible} onChange={e => setFormData({ ...formData, esConsumible: e.target.checked })} />
                      <span className="ml-2 text-sm">Se consume en producción</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={formData.esProducible} onChange={e => setFormData({ ...formData, esProducible: e.target.checked })} />
                      <span className="ml-2 text-sm">Se produce en producción</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipos de lugar permitidos para almacenamiento
                  </label>
                  <select
                    multiple
                    value={formData.tiposLugarPermitidos.map(String)}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
                      setFormData({ ...formData, tiposLugarPermitidos: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-28"
                  >
                    {locationTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Solo se podrán descargar compras a ubicaciones de estos tipos.</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <ProductFormModal
        open={showProductModal}
        initialData={editProduct || undefined}
        onClose={handleProductModalClose}
        onCreated={handleProductUpdated}
      />
    </div>
  );
};

export default Products;

/*
NOTA: Requiere migración en la base de datos para soportar los flags de uso y tipos de lugar permitidos en productos.
SQL sugerido:
ALTER TABLE productos ADD COLUMN es_comprable BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN es_vendible BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN es_consumible BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN es_producible BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN tipos_lugar_permitidos INTEGER[];
*/
// NOTA: Los flags extendidos (esComprable, esVendible, etc.) solo se guardarán en la base de datos tras la migración. Por ahora, solo existen en memoria/frontend.
