import React, {useEffect, useState} from 'react';
import {CreditCard as Edit, MapPin, Plus, Trash2} from 'lucide-react';
import {storage} from '../lib/storage';
import type {Ubicacion} from '../lib/db';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Ubicacion[]>([]);
  const [locationTypes, setLocationTypes] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Ubicacion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [creatingType, setCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  useEffect(() => {
    fetchLocationTypes();
    fetchLocations();
  }, []);

  const fetchLocationTypes = async () => {
    const types = await storage.locationTypes.getAll();
    setLocationTypes(types.map(t => ({ id: t.id!, name: t.name })));
  };

  const fetchLocations = async () => {
    setLoading(true);
    const locs = await storage.ubicaciones.getAll();
    setLocations(locs);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.tipo) {
      alert('Nombre y tipo son requeridos');
      return;
    }
    setLoading(true);
    if (editingLocation) {
      await storage.ubicaciones.update(editingLocation.id!, {
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        updatedAt: new Date(),
      });
      await storage.syncQueue.add({
        operation: 'update',
        table: 'ubicaciones',
        data: { id: editingLocation.id, ...formData },
        createdAt: new Date(),
        synced: false
      });
    } else {
      await storage.ubicaciones.add({
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await storage.syncQueue.add({
        operation: 'create',
        table: 'ubicaciones',
        data: { ...formData },
        createdAt: new Date(),
        synced: false
      });
    }
    await fetchLocations();
    resetForm();
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: '',
      descripcion: '',
    });
    setEditingLocation(null);
    setShowModal(false);
  };

  const handleEdit = (location: Ubicacion) => {
    setFormData({
      nombre: location.nombre,
      tipo: location.tipo,
      descripcion: location.descripcion || '',
    });
    setEditingLocation(location);
    setShowModal(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta ubicación?')) {
      setLoading(true);
      await storage.ubicaciones.delete(id);
      await storage.syncQueue.add({
        operation: 'delete',
        table: 'ubicaciones',
        data: { id },
        createdAt: new Date(),
        synced: false
      });
      await fetchLocations();
      setLoading(false);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      alert('El nombre del tipo es requerido');
      return;
    }
    if (locationTypes.some(t => t.name.toLowerCase() === newTypeName.trim().toLowerCase())) {
      alert('Ya existe un tipo de lugar con ese nombre');
      return;
    }
    const now = new Date();
    const id = await storage.locationTypes.add({
      name: newTypeName.trim(),
      description: newTypeDesc,
      productosPermitidos: [],
      createdAt: now,
      updatedAt: now,
    });
    await storage.syncQueue.add({
      operation: 'create',
      table: 'locationTypes',
      data: { name: newTypeName.trim(), description: newTypeDesc },
      createdAt: new Date(),
      synced: false
    });
    await fetchLocationTypes();
    setFormData({ ...formData, tipo: String(id) });
    setCreatingType(false);
    setNewTypeName('');
    setNewTypeDesc('');
  };

  const filteredLocations = selectedType
    ? locations.filter(location => location.tipo === selectedType)
    : locations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ubicaciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Ubicación</span>
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por tipo:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {locationTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => {
          const typeName = locationTypes.find(t => t.id === Number(location.tipo))?.name || '';
          return (
            <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.nombre}</h3>
                    <p className="text-sm text-gray-500">{typeName}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(location)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {location.descripcion && (
                <p className="text-sm text-gray-600">{location.descripcion}</p>
              )}
            </div>
          );
        })}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
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
                  placeholder="Ej: Patio 1, Bodega A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Lugar *
                </label>
                <select
                  value={formData.tipo}
                  onChange={e => {
                    if (e.target.value === '__new__') {
                      setCreatingType(true);
                    } else {
                      setFormData({ ...formData, tipo: e.target.value });
                      setCreatingType(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar tipo</option>
                  {locationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                  <option value="__new__">+ Crear nuevo tipo...</option>
                </select>
                {creatingType && (
                  <div className="mt-2 space-y-2 bg-blue-50 p-2 rounded">
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={e => setNewTypeName(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Nombre del nuevo tipo"
                    />
                    <textarea
                      value={newTypeDesc}
                      onChange={e => setNewTypeDesc(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Descripción (opcional)"
                    />
                    <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleCreateType}>Guardar tipo</button>
                    <button type="button" className="ml-2 text-gray-600" onClick={() => setCreatingType(false)}>Cancelar</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción de la ubicación"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {editingLocation ? 'Actualizar' : 'Crear'}
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
    </div>
  );
};

export default Locations;

