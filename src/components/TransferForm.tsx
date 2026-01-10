import React, {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {ArrowRight, FileText, MapPin, Package} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface InventoryItem {
  quantity: number;
  locations: {
    id: string;
    name: string;
    type: string;
  };
}

interface TransferFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferForm({ onClose, onSuccess }: TransferFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [formData, setFormData] = useState({
    fromLocationId: '',
    toLocationId: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    loadProducts();
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadInventory();
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('transfers/register', {
        body: {
          action: 'get_inventory_by_location',
          transferData: { productId: selectedProduct }
        }
      });

      if (error) throw error;

      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setFormData(prev => ({
      ...prev,
      fromLocationId: '',
      toLocationId: '',
      quantity: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('transfers/register', {
        body: {
          action: 'create_transfer',
          transferData: {
            productId: selectedProduct,
            quantity: parseFloat(formData.quantity),
            fromLocationId: formData.fromLocationId,
            toLocationId: formData.toLocationId,
            notes: formData.notes
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Error creating transfer:', error);
      alert('Error al crear el traslado: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuantity = (locationId: string) => {
    const item = inventory.find(inv => inv.locations.id === locationId);
    return item ? item.quantity : 0;
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

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
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar producto...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Inventario disponible */}
          {inventory.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Inventario Disponible</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventory.map((item) => (
                  <div key={item.locations.id} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.locations.name}</p>
                        <p className="text-xs text-gray-500">{item.locations.type}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {item.quantity} {selectedProductData?.unit}
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
                value={formData.fromLocationId}
                onChange={(e) => setFormData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar origen...</option>
                {inventory.map((item) => (
                  <option key={item.locations.id} value={item.locations.id}>
                    {item.locations.name} ({item.quantity} {selectedProductData?.unit})
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
                value={formData.toLocationId}
                onChange={(e) => setFormData(prev => ({ ...prev, toLocationId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar destino...</option>
                {locations
                  .filter(loc => loc.id !== formData.fromLocationId)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type})
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
                max={getAvailableQuantity(formData.fromLocationId)}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
              <span className="text-sm text-gray-600">
                {selectedProductData?.unit}
              </span>
            </div>
            {formData.fromLocationId && (
              <p className="mt-1 text-xs text-gray-500">
                Disponible: {getAvailableQuantity(formData.fromLocationId)} {selectedProductData?.unit}
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
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
              disabled={loading || !selectedProduct}
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
