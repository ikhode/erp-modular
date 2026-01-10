import React, {useEffect, useRef, useState} from 'react';
import {storage} from '../lib/storage';
import {ProduccionTicket} from '../lib/db';

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
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // Funciones para firma digital
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    setSignatureData(dataURL);
    setShowSignature(false);
  };

  // Modificar handleSave para incluir firma
  const handleSave = async () => {
    // Validar que todos los insumos tengan cantidad > 0 y ubicación
    const insumosValidos = insumos.every(i => i.productId && i.cantidad > 0 && i.ubicacionId > 0);
    const productosValidos = productosGenerados.every(p => p.productId && p.cantidad > 0 && p.ubicacionDestinoId > 0);
    if (!insumosValidos || !productosValidos) {
      alert('Completa todos los campos requeridos.');
      return;
    }

    // Validar stock disponible para insumos
    for (const insumo of insumos) {
      const inventario = await storage.inventario.getAll();
      const stock = inventario.find(inv => inv.productoId === Number(insumo.productId) && inv.ubicacionId === insumo.ubicacionId)?.cantidad || 0;
      if (stock < insumo.cantidad) {
        alert(`Stock insuficiente para ${insumo.productId} en ubicación ${insumo.ubicacionId}. Disponible: ${stock}`);
        return;
      }
    }

    if (!signatureData) {
      alert('Se requiere la firma digital del empleado.');
      setShowSignature(true);
      return;
    }

    // Crear ticket de producción con firma
    const ticket: Omit<ProduccionTicket, 'id'> = {
      procesoId: Number(proceso.id),
      empleadoId: 1, // TODO: obtener del contexto de usuario
      insumos: insumos.map(i => ({ productoId: Number(i.productId), cantidad: i.cantidad })),
      productoTerminadoId: Number(productosGenerados[0]?.productId),
      cantidadProducida: productosGenerados[0]?.cantidad || 0,
      ubicacionDestinoId: productosGenerados[0]?.ubicacionDestinoId || 0,
      firmaEmpleadoBase64: signatureData,
      estado: 'completado',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Guardar ticket
    await storage.produccion.add(ticket);

    // Actualizar inventario: restar insumos
    for (const insumo of insumos) {
      const inventario = await storage.inventario.getAll();
      const item = inventario.find(inv => inv.productoId === Number(insumo.productId) && inv.ubicacionId === insumo.ubicacionId);
      if (item) {
        await storage.inventario.update(item.id!, { cantidad: item.cantidad - insumo.cantidad, updatedAt: new Date() });
      }
    }

    // Actualizar inventario: sumar producto terminado
    for (const producto of productosGenerados) {
      const inventario = await storage.inventario.getAll();
      const item = inventario.find(inv => inv.productoId === Number(producto.productId) && inv.ubicacionId === producto.ubicacionDestinoId);
      if (item) {
        await storage.inventario.update(item.id!, { cantidad: item.cantidad + producto.cantidad, updatedAt: new Date() });
      } else {
        // Crear nuevo registro de inventario si no existe
        await storage.inventario.add({
          productoId: Number(producto.productId),
          ubicacionId: producto.ubicacionDestinoId,
          cantidad: producto.cantidad,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    alert('Ticket registrado y inventario actualizado.');
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
            <select
              className="border rounded px-2 py-1"
              value={productosGenerados[idx]?.ubicacionDestinoId || ''}
              onChange={e => updateProducto(idx, 'ubicacionDestinoId', Number(e.target.value))}
              required
            >
              <option value="">Ubicación destino</option>
              {ubicaciones.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Registrar Ticket</button>

      {/* Modal de firma digital */}
      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Digital del Empleado</h3>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border border-gray-300 w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button type="button" onClick={clearSignature} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Limpiar</button>
              <button type="button" onClick={saveSignature} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Guardar Firma</button>
            </div>
          </div>
        </div>
      )}
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
