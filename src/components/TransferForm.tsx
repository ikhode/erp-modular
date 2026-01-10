import React, {useEffect, useState} from 'react';
import {ArrowRight, FileText, MapPin, Package} from 'lucide-react';
import {folioGenerator, inventarioStorage, productoStorage, transferStorage, ubicacionStorage} from '../lib/storage';
import {Inventario, Producto, Ubicacion} from '../lib/db';

interface TransferFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferForm({ onClose, onSuccess }: TransferFormProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ubicacionOrigenId: 0,
    ubicacionDestinoId: 0,
    cantidad: 0,
    notas: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadInventoryForProduct();
    }
  }, [selectedProductId]);

  const loadData = async () => {
    try {
      const [productosData, ubicacionesData] = await Promise.all([
        productoStorage.getAll(),
        ubicacionStorage.getAll()
      ]);
      setProductos(productosData);
      setUbicaciones(ubicacionesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadInventoryForProduct = async () => {
    if (!selectedProductId) return;

    try {
      const inventoryData = await inventarioStorage.getAll();
      const productInventory = inventoryData.filter(inv => inv.productoId === selectedProductId);

      // Agregar información de ubicación a cada item de inventario
      const inventoryWithLocationInfo = await Promise.all(
        productInventory.map(async (inv) => {
          const ubicacion = ubicaciones.find(u => u.id === inv.ubicacionId);
          return {
            ...inv,
            ubicacionNombre: ubicacion?.nombre || 'Ubicación desconocida',
            ubicacionTipo: ubicacion?.tipo || 'Tipo desconocido'
          };
        })
      );

      setInventario(inventoryWithLocationInfo);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    setFormData(prev => ({
      ...prev,
      ubicacionOrigenId: 0,
      ubicacionDestinoId: 0,
      cantidad: 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedProductId || !formData.ubicacionOrigenId || !formData.ubicacionDestinoId || !formData.cantidad) {
        throw new Error('Todos los campos son requeridos');
      }

      if (formData.ubicacionOrigenId === formData.ubicacionDestinoId) {
        throw new Error('La ubicación de origen y destino deben ser diferentes');
      }

      // Verificar que hay suficiente inventario en la ubicación de origen
      const origenInventory = inventario.find(inv =>
        inv.productoId === selectedProductId && inv.ubicacionId === formData.ubicacionOrigenId
      );

      if (!origenInventory || origenInventory.cantidad < formData.cantidad) {
        throw new Error('No hay suficiente inventario en la ubicación de origen');
      }

      // Generar folio
      const folio = await folioGenerator.generateFolio('TRAS');

      // Crear el traslado
      await transferStorage.add({
        folio,
        productoId: selectedProductId,
        cantidad: formData.cantidad,
        ubicacionOrigenId: formData.ubicacionOrigenId,
        ubicacionDestinoId: formData.ubicacionDestinoId,
        estado: 'pendiente',
        fechaSolicitud: new Date(),
        notas: formData.notas,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating transfer:', error);
      alert('Error al crear el traslado: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuantity = (ubicacionId: number) => {
    const item = inventario.find(inv => inv.ubicacionId === ubicacionId);
    return item ? item.cantidad : 0;
  };

  const selectedProduct = productos.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Crear Traslado</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="h-4 w-4 inline mr-1" />
              Producto a trasladar
            </label>
            <select
              value={selectedProductId ?? ''}
              onChange={(e) => handleProductChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(product => (
                <option key={product.id} value={product.id}>
                  {product.nombre} ({product.unidad})
                </option>
              ))}
            </select>
          </div>

          {/* Inventario disponible */}
          {inventario.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Inventario Disponible</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventario.map((item) => (
                  <div key={item.ubicacionId} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.ubicacionNombre}</p>
                        <p className="text-xs text-gray-500">{item.ubicacionTipo}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {item.cantidad} {selectedProduct?.unidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ubicación Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Ubicación Origen
              </label>
              <select
                value={formData.ubicacionOrigenId}
                onChange={(e) => setFormData(prev => ({ ...prev, ubicacionOrigenId: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar origen...</option>
                {inventario.map((item) => (
                  <option key={item.ubicacionId} value={item.ubicacionId}>
                    {item.ubicacionNombre} ({item.cantidad} {selectedProduct?.unidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Flecha indicadora */}
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Ubicación Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Ubicación Destino
              </label>
              <select
                value={formData.ubicacionDestinoId}
                onChange={(e) => setFormData(prev => ({ ...prev, ubicacionDestinoId: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar destino...</option>
                {ubicaciones
                  .filter(loc => loc.id !== formData.ubicacionOrigenId)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.nombre} ({location.tipo})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a trasladar
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={getAvailableQuantity(formData.ubicacionOrigenId)}
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
              <span className="text-sm text-gray-600">
                {selectedProduct?.unidad}
              </span>
            </div>
            {formData.ubicacionOrigenId && (
              <p className="mt-1 text-xs text-gray-500">
                Disponible: {getAvailableQuantity(formData.ubicacionOrigenId)} {selectedProduct?.unidad}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Motivo del traslado..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProductId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Traslado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
