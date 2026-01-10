import React, {useEffect, useState} from 'react';
import type {Producto as ProductoBase} from '../lib/db';
import {storage} from '../lib/storage';
import TypeOfPlaceFormModal from './TypeOfPlaceFormModal';

export interface ProductFormModalProps {
  open: boolean;
  initialData?: Partial<ProductoBase>;
  onClose: () => void;
  onCreated: (producto: ProductoBase & { id: number }) => void;
}

const defaultForm = {
  nombre: '',
  descripcion: '',
  precioMin: '',
  precioMax: '',
  precioActual: '',
  unidad: 'kg',
  compra: false,
  venta: false,
  procesoEntrada: false,
  procesoSalida: false,
};

type VariacionProducto = {
  nombre: string;
  aplicaCompra: boolean;
  aplicaProceso: boolean;
  aplicaVenta: boolean;
  seConsumeEnProceso: boolean;
  seProduceEnProceso: boolean;
  requierePrecio: 'fijo' | 'rango' | 'ambos';
  precioCompraFijo?: string;
  precioCompraMin?: string;
  precioCompraMax?: string;
  precioVentaFijo?: string;
  precioVentaMin?: string;
  precioVentaMax?: string;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ open, initialData, onClose, onCreated }) => {
  // Estado tipado para evitar undefined en nombre
  const [formData, setFormData] = useState({
    ...defaultForm,
    ...initialData,
    nombre: (initialData?.nombre ?? ''),
    descripcion: (initialData?.descripcion ?? ''),
    unidad: (initialData?.unidad ?? 'kg'),
  });
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState(['kg', 'L', 'pz', 'm3']);
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [showNuevaUnidad, setShowNuevaUnidad] = useState(false);
  const [tieneVariaciones, setTieneVariaciones] = useState(false);
  const [variaciones, setVariaciones] = useState<VariacionProducto[]>([]);
  const [mermable, setMermable] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'procesos' | 'tiposLugar'>('general');
  const [procesos, setProcesos] = useState<{ id: number; nombre: string }[]>([]);
  const [procesosAsignados, setProcesosAsignados] = useState<number[]>([]);
  const [lugares, setLugares] = useState<{ id: number; nombre: string, tipoId: number }[]>([]);
  const [tiposLugar, setTiposLugar] = useState<{ id: number; nombre: string }[]>([]);
  const [tiposLugarAsignados, setTiposLugarAsignados] = useState<number[]>([]);
  const [showTypeOfPlaceModal, setShowTypeOfPlaceModal] = useState(false);

  // Cargar datos reales de la base de datos
  const loadData = async () => {
    try {
      const [procesosData, lugaresData, tiposLugarData] = await Promise.all([
        storage.procesos.getAll(),
        storage.ubicaciones.getAll(),
        storage.locationTypes.getAll()
      ]);

      setProcesos(procesosData.map(p => ({ id: p.id!, nombre: p.nombre })));
      setLugares(lugaresData.map(l => ({
        id: l.id!,
        nombre: l.nombre,
        tipoId: 1 // TODO: Mapear tipo correcto cuando se implemente
      })));
      setTiposLugar(tiposLugarData.filter(t => t.id !== undefined).map(t => ({
        id: t.id!,
        nombre: t.name
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Refresca tipos de lugar al abrir el modal y tras crear/editar
  const refreshTiposLugar = async () => {
    const tipos = await storage.locationTypes.getAll();
    setTiposLugar(tipos.filter(t => t.id !== undefined).map(t => ({ id: t.id!, nombre: t.name })));
  };

  useEffect(() => {
    if (open) {
      loadData();
    }

    setFormData({
      ...defaultForm,
      ...initialData,
      nombre: (initialData?.nombre ?? ''),
      descripcion: (initialData?.descripcion ?? ''),
      unidad: (initialData?.unidad ?? 'kg'),
    });
    setTieneVariaciones(false);
    setVariaciones([]);
    setMermable(false);
    setProcesosAsignados([]);
    setTiposLugarAsignados([]);
    refreshTiposLugar();
  }, [initialData, open]);

  const handleAddVariacion = () => {
    setVariaciones([...variaciones, {
      nombre: '',
      aplicaCompra: false,
      aplicaProceso: false,
      aplicaVenta: false,
      seConsumeEnProceso: false,
      seProduceEnProceso: false,
      requierePrecio: 'fijo',
      precioCompraFijo: '',
      precioCompraMin: '',
      precioCompraMax: '',
      precioVentaFijo: '',
      precioVentaMin: '',
      precioVentaMax: '',
    }]);
  };

  const handleVariacionChange = (idx: number, key: keyof VariacionProducto, value: string | boolean | number) => {
    setVariaciones(variaciones.map((v, i) => i === idx ? { ...v, [key]: key === 'nombre' ? String(value) : value } : v));
  };

  const handleRemoveVariacion = (idx: number) => {
    setVariaciones(variaciones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productoBase: Omit<ProductoBase, 'id'> = {
        nombre: formData.nombre ? String(formData.nombre) : '',
        descripcion: formData.descripcion || '',
        unidad: formData.unidad || '',
        precioMin: Number(formData.precioMin) || 0,
        precioMax: Number(formData.precioMax) || 0,
        precioActual: Number(formData.precioActual) || 0,
        compra: !!formData.compra,
        venta: !!formData.venta,
        procesoEntrada: !!formData.procesoEntrada,
        procesoSalida: !!formData.procesoSalida,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await storage.productos.add(productoBase);

      // Guardar variaciones en IndexedDB si existen
      if (tieneVariaciones && variaciones.length > 0) {
        for (const variacion of variaciones) {
          await storage.productoVariacion.add({
            productoId: id,
            nombre: variacion.nombre,
            aplicaCompra: variacion.aplicaCompra,
            aplicaProceso: variacion.aplicaProceso,
            aplicaVenta: variacion.aplicaVenta,
            seConsumeEnProceso: variacion.seConsumeEnProceso,
            seProduceEnProceso: variacion.seProduceEnProceso,
            precioCompraMin: variacion.precioCompraMin ? Number(variacion.precioCompraMin) : undefined,
            precioCompraMax: variacion.precioCompraMax ? Number(variacion.precioCompraMax) : undefined,
            precioCompraFijo: variacion.precioCompraFijo ? Number(variacion.precioCompraFijo) : undefined,
            precioVentaMin: variacion.precioVentaMin ? Number(variacion.precioVentaMin) : undefined,
            precioVentaMax: variacion.precioVentaMax ? Number(variacion.precioVentaMax) : undefined,
            precioVentaFijo: variacion.precioVentaFijo ? Number(variacion.precioVentaFijo) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Guardar configuración del producto en IndexedDB
      await storage.productoConfig.add({
        productoId: id,
        mermable,
        procesosAsignados,
        tiposLugarAsignados,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setLoading(false);
      onCreated({ ...productoBase, id } as ProductoBase & { id: number });
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setLoading(false);
      alert('Error al guardar el producto');
    }
  };

  const handleTypeOfPlaceSaved = async () => {
    await refreshTiposLugar();
    setShowTypeOfPlaceModal(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl relative">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{initialData ? 'Editar producto' : 'Nuevo producto'}</h3>
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('general')}
          >General</button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'procesos' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('procesos')}
          >Procesos</button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'tiposLugar' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tiposLugar')}
          >Tipos de Lugar</button>
        </div>
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" className="w-full border rounded px-2 py-1" value={formData.nombre} onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <div className="flex space-x-2">
                <select
                  value={formData.unidad}
                  onChange={e => {
                    if (e.target.value === '__nueva__') {
                      setShowNuevaUnidad(true);
                    } else {
                      setFormData(f => ({ ...f, unidad: e.target.value }));
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
                        setFormData(f => ({ ...f, unidad: nuevaUnidad }));
                        setShowNuevaUnidad(false);
                        setNuevaUnidad('');
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="inline-flex items-center mt-2">
                <input type="checkbox" checked={tieneVariaciones} onChange={e => setTieneVariaciones(e.target.checked)} />
                <span className="ml-2 text-sm">¿Este producto tiene variaciones?</span>
              </label>
              <div className="text-xs text-gray-500 mt-1">Activa para definir variantes como tamaño, calidad, color, etc. Cada variación puede tener reglas de trazabilidad y precios propios.</div>
            </div>
            {tieneVariaciones && (
              <div className="space-y-4 border rounded p-3 bg-gray-50 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">Variaciones</span>
                  <button type="button" className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs" onClick={handleAddVariacion}>+ Añadir variación</button>
                </div>
                {variaciones.map((v, idx) => {
                  // Lógica de flags de sentido común
                  // Si se consume en procesos, debe ser comprado o producido (pero no ambos)
                  const disableCompra = v.seProduceEnProceso || v.aplicaVenta;
                  const disableVenta = v.seProduceEnProceso || v.aplicaCompra || v.seConsumeEnProceso;
                  const disableProduce = v.aplicaCompra || v.aplicaVenta;
                  const disableConsume = v.aplicaVenta;
                  return (
                    <div key={idx} className="border rounded p-2 mb-2 bg-white relative">
                      <button type="button" className="absolute top-1 right-1 text-red-400 hover:text-red-700 text-lg font-bold" onClick={() => handleRemoveVariacion(idx)} aria-label="Eliminar variación">×</button>
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la variación</label>
                        <input type="text" className="w-full border rounded px-2 py-1" value={v.nombre} onChange={e => handleVariacionChange(idx, 'nombre', e.target.value)} required />
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <label className="inline-flex items-center">
                          <input type="checkbox" checked={v.aplicaCompra} disabled={disableCompra} onChange={e => handleVariacionChange(idx, 'aplicaCompra', e.target.checked)} />
                          <span className="ml-1 text-xs">En compras</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="checkbox" checked={v.aplicaVenta} disabled={disableVenta} onChange={e => handleVariacionChange(idx, 'aplicaVenta', e.target.checked)} />
                          <span className="ml-1 text-xs">En ventas</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="checkbox" checked={v.seConsumeEnProceso} disabled={disableConsume} onChange={e => {
                            // Si se activa consumir, y no es comprado, forzar producido
                            handleVariacionChange(idx, 'seConsumeEnProceso', e.target.checked);
                            if (e.target.checked && !v.aplicaCompra) {
                              handleVariacionChange(idx, 'seProduceEnProceso', true);
                            }
                            if (!e.target.checked) {
                              handleVariacionChange(idx, 'seProduceEnProceso', false);
                            }
                          }} />
                          <span className="ml-1 text-xs">Se consume en procesos</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="checkbox" checked={v.seProduceEnProceso} disabled={disableProduce} onChange={e => {
                            // Si se activa producido, y se consume, desactiva comprado
                            handleVariacionChange(idx, 'seProduceEnProceso', e.target.checked);
                            if (e.target.checked && v.seConsumeEnProceso) {
                              handleVariacionChange(idx, 'aplicaCompra', false);
                            }
                          }} />
                          <span className="ml-1 text-xs">Se produce en procesos</span>
                        </label>
                      </div>
                      {/* Precios de compra */}
                      {v.aplicaCompra && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra mín</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioCompraMin} onChange={e => handleVariacionChange(idx, 'precioCompraMin', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra máx</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioCompraMax} onChange={e => handleVariacionChange(idx, 'precioCompraMax', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra actual</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioCompraFijo} onChange={e => handleVariacionChange(idx, 'precioCompraFijo', e.target.value)} />
                          </div>
                        </div>
                      )}
                      {/* Precios de venta */}
                      {v.aplicaVenta && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta mín</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioVentaMin} onChange={e => handleVariacionChange(idx, 'precioVentaMin', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta máx</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioVentaMax} onChange={e => handleVariacionChange(idx, 'precioVentaMax', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta actual</label>
                            <input type="number" className="w-full border rounded px-2 py-1" value={v.precioVentaFijo} onChange={e => handleVariacionChange(idx, 'precioVentaFijo', e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {variaciones.length === 0 && <div className="text-xs text-gray-400">Agrega al menos una variación para este producto.</div>}
              </div>
            )}
            {!tieneVariaciones && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {formData.compra && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra mín</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioMin} onChange={e => setFormData(f => ({ ...f, precioMin: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra máx</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioMax} onChange={e => setFormData(f => ({ ...f, precioMax: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de compra actual</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioActual} onChange={e => setFormData(f => ({ ...f, precioActual: e.target.value }))} />
                      </div>
                    </>
                  )}
                  {formData.venta && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta mín</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioMin} onChange={e => setFormData(f => ({ ...f, precioMin: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta máx</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioMax} onChange={e => setFormData(f => ({ ...f, precioMax: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta actual</label>
                        <input type="number" className="w-full border rounded px-2 py-1" value={formData.precioActual} onChange={e => setFormData(f => ({ ...f, precioActual: e.target.value }))} />
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={formData.compra} disabled={formData.procesoSalida || formData.venta} onChange={e => setFormData(f => ({ ...f, compra: e.target.checked }))} />
                    <span className="ml-2 text-sm">Se usa en compras</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={formData.venta} disabled={formData.procesoSalida || formData.compra} onChange={e => setFormData(f => ({ ...f, venta: e.target.checked }))} />
                    <span className="ml-2 text-sm">Se usa en ventas</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={formData.procesoEntrada} onChange={e => setFormData(f => ({ ...f, procesoEntrada: e.target.checked }))} />
                    <span className="ml-2 text-sm">Se consume en procesos</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={formData.procesoSalida} disabled={formData.compra || formData.venta} onChange={e => setFormData(f => ({ ...f, procesoSalida: e.target.checked }))} />
                    <span className="ml-2 text-sm">Se produce en procesos</span>
                  </label>
                </div>
              </>
            )}
            <div>
              <label className="inline-flex items-center mt-2">
                <input type="checkbox" checked={mermable} onChange={e => setMermable(e.target.checked)} />
                <span className="ml-2 text-sm">¿Este producto es mermable?</span>
              </label>
              <div className="text-xs text-gray-500 mt-1">Si es mermable, se podrá registrar merma en inventario y procesos.</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={onClose}>Cancelar</button>
              <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg" disabled={loading || !formData.nombre.trim()}>Guardar</button>
            </div>
          </form>
        )}
        {activeTab === 'procesos' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procesos relacionados</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {procesos.map(proc => (
                  <label key={proc.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={procesosAsignados.includes(proc.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setProcesosAsignados([...procesosAsignados, proc.id]);
                        } else {
                          setProcesosAsignados(procesosAsignados.filter(id => id !== proc.id));
                        }
                      }}
                    />
                    <span className="ml-2 text-sm">{proc.nombre}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">Asigna los procesos donde este producto es consumido o producido para trazabilidad.</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={onClose}>Cancelar</button>
              <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" onClick={() => setActiveTab('general')}>Guardar y volver</button>
            </div>
          </div>
        )}
        {activeTab === 'tiposLugar' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipos de Lugar relacionados</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tiposLugar.map(tipo => (
                  <label key={tipo.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={tiposLugarAsignados.includes(tipo.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setTiposLugarAsignados([...tiposLugarAsignados, tipo.id]);
                        } else {
                          setTiposLugarAsignados(tiposLugarAsignados.filter(id => id !== tipo.id));
                        }
                      }}
                    />
                    <span className="ml-2 text-sm">{tipo.nombre}</span>
                  </label>
                ))}
                <button
                  type="button"
                  className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  onClick={() => setShowTypeOfPlaceModal(true)}
                >+ Nuevo tipo de lugar</button>
              </div>
              <div className="text-xs text-gray-500 mt-1">Asigna los tipos de lugar donde este producto puede ser almacenado o manipulado.</div>
            </div>
            {/* Mostrar lugares existentes por tipo asignado */}
            {tiposLugarAsignados.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold text-xs text-gray-700 mb-1">Lugares existentes por tipo asignado:</div>
                {tiposLugar.filter(tipo => tiposLugarAsignados.includes(tipo.id)).map(tipo => (
                  <div key={tipo.id} className="mb-2">
                    <div className="text-xs font-bold text-blue-700">{tipo.nombre}</div>
                    <ul className="ml-4 list-disc text-xs text-gray-600">
                      {lugares.filter(l => l.tipoId === tipo.id).length === 0 && (
                        <li className="italic text-gray-400">Sin lugares registrados</li>
                      )}
                      {lugares.filter(l => l.tipoId === tipo.id).map(l => (
                        <li key={l.id}>{l.nombre}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={onClose}>Cancelar</button>
              <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" onClick={() => setActiveTab('general')}>Guardar y volver</button>
            </div>
            {showTypeOfPlaceModal && (
              <TypeOfPlaceFormModal
                open={showTypeOfPlaceModal}
                onClose={() => setShowTypeOfPlaceModal(false)}
                onSaved={handleTypeOfPlaceSaved}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFormModal;

