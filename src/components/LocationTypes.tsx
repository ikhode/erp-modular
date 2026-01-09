import React, {useState} from 'react';
import {CreditCard as Edit, MapPin, Plus, Trash2} from 'lucide-react';

interface LocationType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

const LocationTypes: React.FC = () => {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([
    {
      id: '1',
      name: 'Patios',
      description: 'Áreas de almacenamiento al aire libre para coco fresco',
      icon: 'MapPin',
      color: 'green',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Bodegas',
      description: 'Almacenes techados para productos procesados',
      icon: 'Package',
      color: 'blue',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Tanques',
      description: 'Contenedores para líquidos (agua de coco, aceite)',
      icon: 'Droplets',
      color: 'cyan',
      createdAt: '2024-01-15'
    },
    {
      id: '4',
      name: 'Líneas de Producción',
      description: 'Áreas de procesamiento y transformación',
      icon: 'Factory',
      color: 'orange',
      createdAt: '2024-01-15'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<LocationType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'MapPin',
    color: 'blue'
  });

  const colors = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'orange', label: 'Naranja', class: 'bg-orange-500' },
    { value: 'purple', label: 'Morado', class: 'bg-purple-500' },
    { value: 'red', label: 'Rojo', class: 'bg-red-500' },
    { value: 'cyan', label: 'Cian', class: 'bg-cyan-500' },
  ];


  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (editingType) {
      setLocationTypes(locationTypes.map(type =>
        type.id === editingType.id
          ? { ...type, ...formData }
          : type
      ));
    } else {
      const newType: LocationType = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setLocationTypes([...locationTypes, newType]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'MapPin',
      color: 'blue'
    });
    setEditingType(null);
    setShowModal(false);
  };

  const handleEdit = (type: LocationType) => {
    setFormData({
      name: type.name,
      description: type.description,
      icon: type.icon,
      color: type.color
    });
    setEditingType(type);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este tipo de lugar?')) {
      setLocationTypes(locationTypes.filter(type => type.id !== id));
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      cyan: 'bg-cyan-500',
    };
    return colorMap[color] || 'bg-gray-500';
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locationTypes.map((type) => (
            <div key={type.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClass(type.color)}`}>
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500">Creado: {type.createdAt}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(type)}
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
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingType ? 'Editar Tipo de Lugar' : 'Nuevo Tipo de Lugar'}
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
                  placeholder="Ej: Patios, Bodegas, Tanques"
                />
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
                  placeholder="Descripción del tipo de lugar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({...formData, color: color.value})}
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        formData.color === color.value ? 'ring-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingType ? 'Actualizar' : 'Crear'}
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

export default LocationTypes;