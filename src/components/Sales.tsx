import React, {useRef, useState} from 'react';
import {CreditCard as Edit, DollarSign, Plus, Receipt, Search, ShoppingCart, Trash2} from 'lucide-react';
import {clienteStorage, folioGenerator, productoStorage, storage, ventaStorage} from '../lib/storage';
import {Cliente, Producto, Venta} from '../lib/db';
import PrintButton from './PrintButton';
import {mlService} from '../lib/mlService';

const initialForm: Omit<Venta, 'id' | 'createdAt' | 'updatedAt'> = {
  clienteId: 0,
  productoId: 0,
  cantidad: 0,
  precioUnitario: 0,
  tipoEntrega: 'cliente_recoge',
  estado: 'pendiente',
  vehiculo: '',
  conductor: '',
  notes: '',
  tenantId: '',
};

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Venta | null>(null);
  const [form, setForm] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  React.useEffect(() => {
    async function fetchData() {
      setClientes(await clienteStorage.getAll());
      setProductos(await productoStorage.getAll());
      setSales(await ventaStorage.getAll());
    }
    fetchData();
  }, []);

  // Filtrado corregido
  const filteredSales = sales.filter(sale => {
    const cliente = clientes.find(c => c.id === sale.clienteId)?.nombre || '';
    const producto = productos.find(p => p.id === sale.productoId)?.nombre || '';
    return cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
           producto.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Estadísticas corregidas
  const totalSales = sales.filter(s => s.estado === 'entregado').reduce((sum, s) => sum + (s.cantidad * s.precioUnitario * 1.16), 0);
  const completedSales = sales.filter(s => s.estado === 'entregado').length;
  const totalItems = sales.reduce((sum, s) => sum + s.cantidad, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      default: return method;
    }
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
    if (!form.clienteId || !form.productoId || !form.cantidad || !form.precioUnitario) return;

    // Validar firma si es entrega al cliente
    if (form.tipoEntrega === 'cliente_recoge' && form.estado === 'entregado' && !signatureData) {
      alert('Se requiere la firma digital del cliente para entregas.');
      setShowSignature(true);
      return;
    }

    const now = new Date();
    if (editingSale) {
      await ventaStorage.update(editingSale.id!, { ...form, updatedAt: now });
    } else {
      // Generar folio automático
      const folio = await folioGenerator.generateFolio('VENT');

      const newSale = {
        ...form,
        folio,
        firmaClienteBase64: signatureData,
        createdAt: now,
        updatedAt: now
      };

      await ventaStorage.add(newSale);

      // Insertar datos en ML service para aprendizaje continuo
      try {
        await mlService.insertTrainingData('sale', {
          ...newSale,
          cantidad: form.cantidad,
          precioUnitario: form.precioUnitario,
          productoId: form.productoId,
          clienteId: form.clienteId,
          tipoEntrega: form.tipoEntrega
        });
      } catch (error) {
        console.error('Error insertando datos de venta en ML:', error);
      }

      // Restar inventario al completar venta
      if (form.estado === 'entregado') {
        const inventario = await storage.inventario.getAll();
        const item = inventario.find(inv => inv.productoId === form.productoId && inv.ubicacionId === 1); // TODO: ubicación configurable
        if (item && item.cantidad >= form.cantidad) {
          await storage.inventario.update(item.id!, { cantidad: item.cantidad - form.cantidad, updatedAt: now });

          // Insertar datos de inventario en ML
          try {
            await mlService.insertTrainingData('inventory', {
              productoId: form.productoId,
              ubicacionId: 1,
              cantidad: item.cantidad - form.cantidad,
              movimiento: -form.cantidad,
              tipoMovimiento: 'venta'
            });
          } catch (error) {
            console.error('Error insertando datos de inventario en ML:', error);
          }
        } else {
          alert('Stock insuficiente para completar la venta.');
          return;
        }
      }
    }
    setSales(await ventaStorage.getAll());
    setShowModal(false);
    setEditingSale(null);
    setForm(initialForm);
    setSignatureData('');
  };

  const handleEdit = (sale: Venta) => {
    setEditingSale(sale);
    setForm({ ...sale });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta venta?')) {
      await ventaStorage.delete(id);
      setSales(await ventaStorage.getAll());
    }
  };

  const generateSaleTicketData = (sale: Venta) => {
    const cliente = clientes.find(c => c.id === sale.clienteId);
    const producto = productos.find(p => p.id === sale.productoId);
    const subtotal = sale.cantidad * sale.precioUnitario;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return {
      type: 'sale' as const,
      folio: sale.folio || `VENT-${sale.id}`,
      date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
      customer: cliente?.nombre || 'Cliente no especificado',
      items: [{
        description: producto?.nombre || 'Producto no especificado',
        quantity: sale.cantidad,
        unit: 'pieza', // TODO: obtener de la configuración del producto
        price: sale.precioUnitario,
        total: subtotal
      }],
      subtotal,
      tax: iva,
      total,
      notes: sale.notes || ''
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold">${totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold">{completedSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Items Vendidos</p>
              <p className="text-2xl font-bold">{totalItems}</p>
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
            placeholder="Buscar ventas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clientes.find(c => c.id === sale.clienteId)?.nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {productos.find(p => p.id === sale.productoId)?.nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(sale.cantidad * sale.precioUnitario).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${((sale.cantidad * sale.precioUnitario) * 0.16).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${(sale.cantidad * sale.precioUnitario * 1.16).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getPaymentMethodLabel(sale.tipoEntrega)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.estado)}`}>
                      {getStatusLabel(sale.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <PrintButton
                        data={generateSaleTicketData(sale)}
                        type="thermal"
                        size="sm"
                        variant="outline"
                        showOptions={false}
                      />
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => sale.id && handleDelete(sale.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de alta/edición de venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSale ? 'Editar Venta' : 'Nueva Venta'}
            </h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.clienteId}
                    onChange={e => setForm(f => ({ ...f, clienteId: Number(e.target.value) }))}
                    required
                  >
                    <option value={0}>Selecciona cliente</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producto</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.productoId}
                    onChange={e => setForm(f => ({ ...f, productoId: Number(e.target.value) }))}
                    required
                  >
                    <option value={0}>Selecciona producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={form.cantidad}
                    min={1}
                    onChange={e => setForm(f => ({ ...f, cantidad: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Unitario</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={form.precioUnitario}
                    min={0}
                    step={0.01}
                    onChange={e => setForm(f => ({ ...f, precioUnitario: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de entrega</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.tipoEntrega}
                    onChange={e => setForm(f => ({ ...f, tipoEntrega: e.target.value as Venta['tipoEntrega'] }))}
                  >
                    <option value="cliente_recoge">Cliente recoge</option>
                    <option value="flete_propio">Flete propio</option>
                    <option value="flete_externo">Flete externo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Venta['estado'] }))}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_preparacion">En preparación</option>
                    <option value="en_transito">En tránsito</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
                {/* Nuevos campos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehículo</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={form.vehiculo}
                    onChange={e => setForm(f => ({ ...f, vehiculo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conductor</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1"
                    value={form.conductor}
                    onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSale(null);
                    setForm(initialForm);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sección de firma si es entrega al cliente */}
      {form.tipoEntrega === 'cliente_recoge' && form.estado === 'entregado' && (
        <div className="space-y-2">
          <h4 className="font-semibold">Firma Digital del Cliente</h4>
          <div className="flex space-x-2">
            <button type="button" onClick={() => setShowSignature(true)} className={`px-3 py-1 rounded ${signatureData ? 'bg-green-200' : 'bg-gray-200'}`}>Firmar</button>
          </div>
        </div>
      )}

      {/* Modal de firma digital */}
      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Digital del Cliente</h3>
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

export default Sales;
