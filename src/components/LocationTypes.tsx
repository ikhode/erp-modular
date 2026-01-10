import React, {useEffect, useState} from 'react';
import {CreditCard as Edit, MapPin, Plus, Trash2} from 'lucide-react';
import {storage} from '../lib/storage';
import type {Producto} from '../lib/db';
import TypeOfPlaceFormModal from './TypeOfPlaceFormModal';

interface LocationType {
  id?: number;
  name: string;
  description?: string;
  productosPermitidos?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const LocationTypes: React.FC = () => {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<LocationType | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar tipos de lugar desde storage
  useEffect(() => {
    fetchLocationTypes();
    storage.productos.getAll().then(setProductos);
  }, []);

  const fetchLocationTypes = async () => {
    setLoading(true);
    const types = await storage.locationTypes.getAll();
    setLocationTypes(types);
    setLoading(false);
  };

  const handleSaved = () => {
    fetchLocationTypes();
    setShowModal(false);
    setEditingType(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar este tipo de lugar?')) {
      setLoading(true);
      await storage.locationTypes.delete(id);
      await storage.syncQueue.add('delete', 'locationTypes', { id });
      await fetchLocationTypes();
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tipos de Lugar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Tipo</span>
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-6">
          Los tipos de lugar definen las categorías de ubicaciones donde se almacenan los productos.
          Una vez creado un tipo, podrá crear ubicaciones específicas de ese tipo.
        </p>
        {loading ? (
          <div className="text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationTypes.map((type) => (
              <div key={type.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-500">Creado: {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingType(type);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{type.description}</p>
                {type.productosPermitidos && type.productosPermitidos.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Productos permitidos: {type.productosPermitidos.map((pid: number) => productos.find(p => p.id === pid)?.nombre).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <TypeOfPlaceFormModal
          open={showModal}
          initialData={editingType || undefined}
          onClose={() => { setShowModal(false); setEditingType(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default LocationTypes;

