import React, {useEffect, useState} from 'react';
import {storage} from '../lib/storage';

interface ProcessItem {
  productId?: string; // opcional si es por tipo
  productTypeId?: number; // opcional si es por producto
  productName: string;
  productTypeName?: string;
  quantity: number;
  unit: string;
  allowedLocationTypes?: number[];
}

interface Process {
  id: string;
  name: string;
  description: string;
  inputs: ProcessItem[];
  outputs: ProcessItem[];
}

interface Ubicacion {
  id: number;
  nombre: string;
  tipo: string;
}

interface TicketInsumo {
  productId: string;
  ubicacionId: number;
  cantidad: number;
  unidad: string;
}

interface TicketProducto {
  productId: string;
  ubicacionDestinoId: number;
  cantidad: number;
  unidad: string;
}

const ProductionTicket: React.FC<{ proceso: Process }> = ({ proceso }) => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [insumos, setInsumos] = useState<TicketInsumo[]>([]);
  const [productosGenerados, setProductosGenerados] = useState<TicketProducto[]>([]);
  // Elimina productTypes y su carga si no existe en storage
  const [productos, setProductos] = useState<{ id: number; nombre: string; tipoId?: number; unidad: string }[]>([]);

  useEffect(() => {
    storage.ubicaciones.getAll().then(us => setUbicaciones(us.map(u => ({ id: u.id!, nombre: u.nombre, tipo: u.tipo }))));
    // Carga productos, tipoId es opcional
    storage.productos.getAll().then(ps => setProductos(ps.map(p => ({ id: p.id!, nombre: p.nombre, tipoId: getTipoId(p), unidad: p.unidad }))));
    // Inicializar insumos y productos generados según proceso
    setInsumos(
      proceso.inputs.map(input => ({
        productId: input.productId || '',
        productTypeId: input.productTypeId || undefined,
        ubicacionId: 0,
        cantidad: 0,
        unidad: input.unit
      }))
    );
    setProductosGenerados(
      proceso.outputs.map(output => ({
        productId: output.productId || '',
        ubicacionDestinoId: 0,
        cantidad: 0,
        unidad: output.unit
      }))
    );
  }, [proceso]);

  // Utilidad para filtrar ubicaciones válidas para un insumo
  const getValidLocations = (input: ProcessItem) => {
    if (!input.allowedLocationTypes || input.allowedLocationTypes.length === 0) return ubicaciones;
    return ubicaciones.filter(u => input.allowedLocationTypes!.includes(Number(u.tipo)));
  };

  // Handler para actualizar insumo
  const updateInsumo = (idx: number, field: keyof TicketInsumo, value: string | number) => {
    const updated = [...insumos];
    // @ts-expect-error: asignación dinámica controlada
    updated[idx][field] = value;
    setInsumos(updated);
  };

  // Handler para actualizar producto generado
  const updateProducto = (idx: number, field: keyof TicketProducto, value: string | number) => {
    const updated = [...productosGenerados];
    // @ts-expect-error: asignación dinámica controlada
    updated[idx][field] = value;
    setProductosGenerados(updated);
  };

  // Validación de stock (puedes expandirlo según inventario real)
  // ...

  // Guardar ticket (puedes integrar con storage/db)
  const handleSave = () => {
    // Validar y registrar movimientos
    // ...
    alert('Ticket registrado (demo)');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ejecución de Proceso: {proceso.name}</h2>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Insumos a consumir</h3>
        {proceso.inputs.map((input, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-2 mb-2">
            {input.productTypeId ? (
              <>
                <span className="w-40">{input.productTypeName || 'Tipo de producto'}</span>
                <select
                  className="border rounded px-2 py-1"
                  value={insumos[idx]?.productId || ''}
                  onChange={e => updateInsumo(idx, 'productId', e.target.value)}
                  required
                >
                  <option value="">Selecciona producto</option>
                  {productos.filter(p => p.tipoId === input.productTypeId).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>
                  ))}
                </select>
              </>
            ) : (
              <span className="w-40">{input.productName}</span>
            )}
            <select
              className="border rounded px-2 py-1"
              value={insumos[idx]?.ubicacionId || ''}
              onChange={e => updateInsumo(idx, 'ubicacionId', Number(e.target.value))}
              required
            >
              <option value="">Ubicación origen</option>
              {getValidLocations(input).map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              className="border rounded px-2 py-1 w-20"
              value={insumos[idx]?.cantidad || ''}
              onChange={e => updateInsumo(idx, 'cantidad', Number(e.target.value))}
              required
            />
            <span className="w-16">{input.unit}</span>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Productos generados</h3>
        {proceso.outputs.map((output, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-2 mb-2">
            <span className="w-40">{output.productName}</span>
            <input
              type="number"
              min="0"
              className="border rounded px-2 py-1 w-20"
              value={productosGenerados[idx]?.cantidad || ''}
              onChange={e => updateProducto(idx, 'cantidad', Number(e.target.value))}
              required
            />
            <span className="w-16">{output.unit}</span>
            {/* Si quieres permitir elegir ubicación destino, agrega aquí un select */}
          </div>
        ))}
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Registrar Ticket</button>
    </div>
  );
};

function getTipoId(p: unknown): number | undefined {
  if (typeof p === 'object' && p !== null && 'tipoId' in p) {
    const obj = p as { tipoId?: number };
    return obj.tipoId;
  }
  return undefined;
}

export default ProductionTicket;
