import React, {useEffect, useState} from 'react';
import {storage} from '../lib/storage';
import type {Producto} from '../lib/db';

export interface TypeOfPlaceFormModalProps {
  open: boolean;
  initialData?: TypeOfPlaceFormData;
  onClose: () => void;
  onSaved: () => void;
}

export interface TypeOfPlaceFormData {
  id?: number;
  name: string;
  description?: string;
  productosPermitidos?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

const defaultForm: TypeOfPlaceFormData = {
  name: '',
  description: '',
  productosPermitidos: [],
};

const TypeOfPlaceForm: React.FC<{
  formData: TypeOfPlaceFormData;
  setFormData: React.Dispatch<React.SetStateAction<TypeOfPlaceFormData>>;
  productos: Producto[];
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ formData, setFormData, productos, loading, onSubmit, onCancel }) => {
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnidad, setNewProductUnidad] = useState('');
  const [productosLocal, setProductosLocal] = useState<Producto[]>(productos);
  useEffect(() => { setProductosLocal(productos); }, [productos]);

  const handleCreateProduct = async () => {
    if (!newProductName.trim() || !newProductUnidad.trim()) return;
    const now = new Date();
    const prod = {
      nombre: newProductName.trim(),
      unidad: newProductUnidad.trim(),
      precioMin: 0,
      precioMax: 0,
      precioActual: 0,
      compra: false,
      venta: false,
      procesoEntrada: false,
      procesoSalida: false,
      createdAt: now,
      updatedAt: now,
    };
    const id = await storage.productos.add(prod);
    setProductosLocal([...productosLocal, { ...prod, id }]);
    setFormData(f => ({ ...f, productosPermitidos: [...(f.productosPermitidos || []), id] }));
    setShowNewProductInput(false);
    setNewProductName('');
    setNewProductUnidad('');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Patios, Bodegas, Tanques"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Descripción del tipo de lugar"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Productos permitidos</label>
        <select
          multiple
          value={formData.productosPermitidos?.map(String) || []}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
            setFormData(f => ({ ...f, productosPermitidos: options }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {productosLocal.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>
          ))}
          <option value="__nuevo__">+ Crear nuevo producto...</option>
        </select>
        {showNewProductInput ? (
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              placeholder="Nombre del producto"
              className="w-1/2 px-2 py-1 border rounded"
            />
            <input
              type="text"
              value={newProductUnidad}
              onChange={e => setNewProductUnidad(e.target.value)}
              placeholder="Unidad"
              className="w-1/2 px-2 py-1 border rounded"
            />
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleCreateProduct}>Guardar</button>
            <button type="button" className="ml-2 text-gray-600" onClick={() => setShowNewProductInput(false)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className="mt-2 text-blue-600 text-xs underline" onClick={() => setShowNewProductInput(true)}>+ Crear nuevo producto</button>
        )}
      </div>
      <div className="flex space-x-3 mt-6">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

const TypeOfPlaceFormModal: React.FC<TypeOfPlaceFormModalProps> = ({ open, initialData, onClose, onSaved }) => {
  const [formData, setFormData] = useState<TypeOfPlaceFormData>(defaultForm);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      ...defaultForm,
      ...initialData,
      productosPermitidos: initialData?.productosPermitidos || [],
    });
    storage.productos.getAll().then(setProductos);
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }
    setLoading(true);
    const payload: TypeOfPlaceFormData = {
      ...formData,
      updatedAt: new Date(),
      createdAt: initialData?.createdAt ? initialData.createdAt : new Date(),
    };
    // Forzar tipado fuerte para Dexie: nunca undefined
    const payloadFixed = {
      ...payload,
      createdAt: payload.createdAt || new Date(),
      updatedAt: payload.updatedAt || new Date(),
    };
    if (initialData?.id) {
      await storage.locationTypes.update(initialData.id, payloadFixed);
      await storage.syncQueue.add({
        operation: 'update',
        table: 'locationTypes',
        data: { id: initialData.id, ...payloadFixed },
        createdAt: new Date(),
        synced: false
      });
    } else {
      await storage.locationTypes.add(payloadFixed);
      await storage.syncQueue.add({
        operation: 'create',
        table: 'locationTypes',
        data: { ...payloadFixed },
        createdAt: new Date(),
        synced: false
      });
    }
    setLoading(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {initialData?.id ? 'Editar Tipo de Lugar' : 'Nuevo Tipo de Lugar'}
        </h3>
        <TypeOfPlaceForm
          formData={formData}
          setFormData={setFormData}
          productos={productos}
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default TypeOfPlaceFormModal;
