import React, {useState} from 'react';
import {CreditCard as Edit, MapPin, Plus, Trash2} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  capacity: number;
  unit: string;
  currentStock: number;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

const Locations: React.FC = () => {
  const locationTypes = [
    { id: '1', name: 'Patios', color: 'green' },
    { id: '2', name: 'Bodegas', color: 'blue' },
    { id: '3', name: 'Tanques', color: 'cyan' },
    { id: '4', name: 'Líneas de Producción', color: 'orange' },
  ];

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Patio 1',
      typeId: '1',
      typeName: 'Patios',
      capacity: 5000,
      unit: 'kg',
      currentStock: 3200,
      description: 'Patio principal para coco fresco',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Patio 2',
      typeId: '1',
      typeName: 'Patios',
      capacity: 3000,
      unit: 'kg',
      currentStock: 1800,
      description: 'Patio secundario para coco clasificado',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Bodega A',
      typeId: '2',
      typeName: 'Bodegas',
      capacity: 2000,
      unit: 'kg',
      currentStock: 850,
      description: 'Almacén de productos terminados',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '4',
      name: 'Tanque Agua 1',
      typeId: '3',
      typeName: 'Tanques',
      capacity: 1000,
      unit: 'L',
      currentStock: 750,
      description: 'Tanque para agua de coco',
      status: 'active',
      createdAt: '2024-01-15'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    capacity: '',
    unit: 'kg',
    description: '',
    status: 'active' as const
  });

  const units = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'L', label: 'Litros' },
    { value: 'pz', label: 'Piezas' },
    { value: 'm3', label: 'Metros Cúbicos' },
  ];

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.typeId) {
      alert('Nombre y tipo son requeridos');
      return;
    }

    const selectedTypeData = locationTypes.find(t => t.id === formData.typeId);
    
    if (editingLocation) {
      setLocations(locations.map(location =>
        location.id === editingLocation.id
          ? { 
              ...location, 
              ...formData,
              typeName: selectedTypeData?.name || '',
              capacity: Number(formData.capacity)
            }
          : location
      ));
    } else {
      const newLocation: Location = {
        id: Date.now().toString(),
        ...formData,
        typeName: selectedTypeData?.name || '',
        capacity: Number(formData.capacity),
        currentStock: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setLocations([...locations, newLocation]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      typeId: '',
      capacity: '',
      unit: 'kg',
      description: '',
      status: 'active'
    });
    setEditingLocation(null);
    setShowModal(false);
  };

  const handleEdit = (location: Location) => {
    setFormData({
      name: location.name,
      typeId: location.typeId,
      capacity: location.capacity.toString(),
      unit: location.unit,
      description: location.description,
      status: location.status
    });
    setEditingLocation(location);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta ubicación?')) {
      setLocations(locations.filter(location => location.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Desconocido';
    }
  };

  const getOccupancyPercentage = (current: number, capacity: number) => {
    return capacity > 0 ? (current / capacity) * 100 : 0;
  };

  const filteredLocations = selectedType 
    ? locations.filter(location => location.typeId === selectedType)
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

      {/* Filter by Type */}
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

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => {
          const occupancyPercentage = getOccupancyPercentage(location.currentStock, location.capacity);
          
          return (
            <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-500">{location.typeName}</p>
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                    {getStatusLabel(location.status)}
                  </span>
                  <div className="text-sm text-gray-600">
                    Capacidad: {location.capacity} {location.unit}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Ocupación</span>
                    <span>{location.currentStock} / {location.capacity} {location.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        occupancyPercentage > 90 ? 'bg-red-500' :
                        occupancyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {Math.round(occupancyPercentage)}% ocupado
                  </div>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600">{location.description}</p>
                )}
              </div>
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
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Patio 1, Bodega A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Lugar *
                </label>
                <select
                  value={formData.typeId}
                  onChange={(e) => setFormData({...formData, typeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar tipo</option>
                  {locationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "inactive" | "maintenance"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
              >
                {editingLocation ? 'Actualizar' : 'Crear'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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