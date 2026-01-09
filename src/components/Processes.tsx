import React, { useState } from 'react';
import { Cog, Plus, CreditCard as Edit, Trash2, Search, DollarSign } from 'lucide-react';

interface Process {
  id: string;
  name: string;
  description: string;
  inputs: ProcessItem[];
  outputs: ProcessItem[];
  paymentType: 'fixed' | 'per_unit' | 'per_weight' | 'per_volume';
  paymentRate: number;
  paymentUnit: string;
  isActive: boolean;
  createdAt: string;
}

interface ProcessItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([
    {
      id: '1',
      name: 'Empaquetado',
      description: 'Proceso de empaquetado de productos terminados',
      inputs: [
        { productId: '1', productName: 'Producto a granel', quantity: 1, unit: 'kg' }
      ],
      outputs: [
        { productId: '2', productName: 'Producto empaquetado', quantity: 2, unit: 'pz' }
      ],
      paymentType: 'per_unit',
      paymentRate: 2.5,
      paymentUnit: 'pz',
      isActive: true,
      createdAt: '2024-01-15'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const paymentTypes = [
    { value: 'fixed', label: 'Pago Fijo' },
    { value: 'per_unit', label: 'Por Unidad' },
    { value: 'per_weight', label: 'Por Peso' },
    { value: 'per_volume', label: 'Por Volumen' }
  ];

  const filteredProcesses = processes.filter(process =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (process: Process) => {
    setEditingProcess(process);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este proceso?')) {
      setProcesses(processes.filter(p => p.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setProcesses(processes.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Procesos de Producción</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Proceso</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Cog className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Procesos</p>
              <p className="text-2xl font-bold">{processes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Cog className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold">{processes.filter(p => p.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Con Pago</p>
              <p className="text-2xl font-bold">{processes.filter(p => p.paymentRate > 0).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Cog className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold">{processes.filter(p => !p.isActive).length}</p>
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
            placeholder="Buscar procesos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Processes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProcesses.map((process) => (
          <div key={process.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{process.name}</h3>
                <p className="text-sm text-gray-600">{process.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(process.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    process.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {process.isActive ? 'Activo' : 'Inactivo'}
                </button>
                <button
                  onClick={() => handleEdit(process)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(process.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Inputs */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Insumos</h4>
                <div className="space-y-1">
                  {process.inputs.map((input, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                      {input.productName}: {input.quantity} {input.unit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Generados</h4>
                <div className="space-y-1">
                  {process.outputs.map((output, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                      {output.productName}: {output.quantity} {output.unit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pago:</span>
                  <span className="font-medium">
                    ${process.paymentRate} {paymentTypes.find(t => t.value === process.paymentType)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal placeholder - would implement full modal here */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProcess ? 'Editar Proceso' : 'Nuevo Proceso'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidad completa del modal en desarrollo...
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingProcess(null);
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

export default Processes;