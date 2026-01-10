import React, {useRef, useState} from 'react';
import {CreditCard, Edit, Plus, Search, ShoppingBag, Trash2} from 'lucide-react';
import {compraStorage, folioGenerator, productoStorage, proveedorStorage, storage} from '../lib/storage';
import {Compra, Producto, Proveedor} from '../lib/db';
import PrintButton from './PrintButton';

const initialForm: Omit<Compra, 'id' | 'createdAt' | 'updatedAt'> = {
  proveedorId: 0,
  productoId: 0,
  cantidad: 0,
  precioUnitario: 0,
  tipo: 'planta',
  estado: 'salida',
  vehiculo: '',
  conductor: '',
  notes: '',
};

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Compra | null>(null);
  const [form, setForm] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica para alta rápida de proveedor/producto desde el modal de compra
  const [showNewProveedor, setShowNewProveedor] = useState(false);
  const [showNewProducto, setShowNewProducto] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState<Omit<Proveedor, 'id'>>({ nombre: '', rfc: '', createdAt: new Date(), updatedAt: new Date() });
  const [nuevoProducto, setNuevoProducto] = useState<Omit<Producto, 'id'>>({ nombre: '', precioMin: 0, precioMax: 0, precioActual: 0, unidad: '', compra: true, venta: false, procesoEntrada: false, procesoSalida: false, createdAt: new Date(), updatedAt: new Date() });

  const [showSignature, setShowSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<'conductor' | 'encargado' | 'proveedor'>('conductor');
  const [signatures, setSignatures] = useState<{ conductor?: string; encargado?: string; proveedor?: string }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const filteredPurchases = purchases.filter(purchase => {
    const proveedor = proveedores.find(p => p.id === purchase.proveedorId)?.nombre || '';
    const producto = productos.find(p => p.id === purchase.productoId)?.nombre || '';
    return proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
           producto.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Recibido';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  React.useEffect(() => {
    async function fetchData() {
      setProveedores(await proveedorStorage.getAll());
      setProductos(await productoStorage.getAll());
      setPurchases(await compraStorage.getAll());
    }
    fetchData();
  }, []);

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
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    setSignatures(prev => ({ ...prev, [signatureType]: dataURL }));
    setShowSignature(false);
    clearSignature();
  };

  const requestSignature = (type: 'conductor' | 'encargado' | 'proveedor') => {
    setSignatureType(type);
    setShowSignature(true);
  };

  const handleSave = async () => {
    if (!form.proveedorId || !form.productoId || !form.cantidad || !form.precioUnitario) return;

    // Validar firmas requeridas según tipo
    if (form.tipo === 'parcela') {
      if (!signatures.conductor || !signatures.encargado || !signatures.proveedor) {
        alert('Se requieren todas las firmas para compras en parcela.');
        return;
      }
    } else {
      if (!signatures.encargado || !signatures.proveedor) {
        alert('Se requieren firmas del encargado y proveedor.');
        return;
      }
    }

    const now = new Date();
    if (editingPurchase) {
      await compraStorage.update(editingPurchase.id!, { ...form, updatedAt: now });
    } else {
      // Generar folio automático
      const folio = await folioGenerator.generateFolio('COMP');

      await compraStorage.add({
        ...form,
        folio,
        firmaConductorBase64: signatures.conductor,
        firmaEncargadoBase64: signatures.encargado,
        firmaProveedorBase64: signatures.proveedor,
        createdAt: now,
        updatedAt: now
      });
      // Sumar inventario al completar compra
      if (form.estado === 'completado') {
        const inventario = await storage.inventario.getAll();
        const item = inventario.find(inv => inv.productoId === form.productoId && inv.ubicacionId === 1); // TODO: ubicación configurable
        if (item) {
          await storage.inventario.update(item.id!, { cantidad: item.cantidad + form.cantidad, updatedAt: now });
        } else {
          await storage.inventario.add({
            productoId: form.productoId,
            ubicacionId: 1, // TODO: ubicación configurable
            cantidad: form.cantidad,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
    setPurchases(await compraStorage.getAll());
    setShowModal(false);
    setEditingPurchase(null);
    setForm(initialForm);
    setSignatures({});
  };

  const handleEdit = (purchase: Compra) => {
    setEditingPurchase(purchase);
    setForm({ ...purchase });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      await compraStorage.delete(id);
      setPurchases(await compraStorage.getAll());
    }
  };

  const generatePurchaseTicketData = (purchase: Compra) => {
    const proveedor = proveedores.find(p => p.id === purchase.proveedorId);
    const producto = productos.find(p => p.id === purchase.productoId);
    const subtotal = purchase.cantidad * purchase.precioUnitario;

    return {
      type: 'purchase' as const,
      folio: purchase.folio || `COMP-${purchase.id}`,
      date: purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
      provider: proveedor?.nombre || 'Proveedor no especificado',
      items: [{
        description: producto?.nombre || 'Producto no especificado',
        quantity: purchase.cantidad,
        unit: producto?.unidad || 'pieza',
        total: subtotal
      }],
      subtotal,
      tax: 0, // Las compras no incluyen IVA calculado automáticamente
      total: subtotal,
      notes: purchase.notes || `Tipo: ${purchase.tipo} | Vehículo: ${purchase.vehiculo || 'N/A'} | Conductor: ${purchase.conductor || 'N/A'}`
    };
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
  const pendingPurchases = purchases.filter(p => p.estado === 'salida').length;
  const receivedPurchases = purchases.filter(p => p.estado === 'completado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Recibidas</p>
              <p className="text-2xl font-bold">{receivedPurchases}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">{pendingPurchases}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold">${totalPurchases.toLocaleString()}</p>
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
            placeholder="Buscar compras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
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
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {proveedores.find(pr => pr.id === purchase.proveedorId)?.nombre || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {productos.find(pr => pr.id === purchase.productoId)?.nombre || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.cantidad} {productos.find(pr => pr.id === purchase.productoId)?.unidad || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${purchase.precioUnitario.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${(purchase.cantidad * purchase.precioUnitario).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.estado)}`}>
                      {getStatusLabel(purchase.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <PrintButton
                        data={generatePurchaseTicketData(purchase)}
                        type="thermal"
                        size="sm"
                        variant="outline"
                        showOptions={false}
                      />
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => purchase.id && handleDelete(purchase.id)}
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

      {/* Modal de alta/edición de compra */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
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
                  <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.proveedorId}
                    onChange={e => setForm(f => ({ ...f, proveedorId: Number(e.target.value) }))}
                    required
                  >
                    <option value={0}>Selecciona proveedor</option>
                    {proveedores.length === 0 && <option disabled value={0}>No hay proveedores registrados</option>}
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  {proveedores.length === 0 && (
                    <div className="text-xs text-blue-600 mt-1">No hay proveedores. <button type="button" className="underline" onClick={() => setShowNewProveedor(true)}>Crear nuevo</button></div>
                  )}
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
                    {productos.length === 0 && <option disabled value={0}>No hay productos registrados</option>}
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  {productos.length === 0 && (
                    <div className="text-xs text-blue-600 mt-1">No hay productos. <button type="button" className="underline" onClick={() => setShowNewProducto(true)}>Crear nuevo</button></div>
                  )}
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
                  <label className="block text-sm font-medium text-gray-700">Tipo de compra</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'parcela' | 'planta' }))}
                  >
                    <option value="planta">Planta</option>
                    <option value="parcela">Parcela</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Compra['estado'] }))}
                  >
                    <option value="salida">Salida</option>
                    <option value="carga">Carga</option>
                    <option value="regreso">Regreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
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
                    rows={3}
                  />
                </div>
              </div>

              {/* Firmas */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Firmas</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => requestSignature('conductor')}
                      className="w-full bg-gray-100 border rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <img src={signatures.conductor} alt="Firma Conductor" className="h-8" />
                      <span>Firma Conductor</span>
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => requestSignature('encargado')}
                      className="w-full bg-gray-100 border rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <img src={signatures.encargado} alt="Firma Encargado" className="h-8" />
                      <span>Firma Encargado</span>
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => requestSignature('proveedor')}
                      className="w-full bg-gray-100 border rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <img src={signatures.proveedor} alt="Firma Proveedor" className="h-8" />
                      <span>Firma Proveedor</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Guardar Compra</span>
                </button>
              </div>
            </form>

            {/* Nueva sección para creación rápida de proveedor/producto */}
            {showNewProveedor && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Nuevo Proveedor</h4>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    // Guardar nuevo proveedor
                    proveedorStorage.add({
                      ...nuevoProveedor,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }).then(async () => {
                      setNuevoProveedor({ nombre: '', rfc: '', createdAt: new Date(), updatedAt: new Date() });
                      setProveedores(await proveedorStorage.getAll());
                    });
                  }}
                  className="grid grid-cols-1 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProveedor.nombre}
                      onChange={e => setNuevoProveedor(n => ({ ...n, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RFC</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProveedor.rfc}
                      onChange={e => setNuevoProveedor(n => ({ ...n, rfc: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowNewProveedor(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Guardar Proveedor
                    </button>
                  </div>
                </form>
              </div>
            )}
            {showNewProducto && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Nuevo Producto</h4>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    // Guardar nuevo producto
                    productoStorage.add({
                      ...nuevoProducto,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }).then(async () => {
                      setNuevoProducto({ nombre: '', precioMin: 0, precioMax: 0, precioActual: 0, unidad: '', compra: true, venta: false, procesoEntrada: false, procesoSalida: false, createdAt: new Date(), updatedAt: new Date() });
                      setProductos(await productoStorage.getAll());
                    });
                  }}
                  className="grid grid-cols-1 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProducto.nombre}
                      onChange={e => setNuevoProducto(n => ({ ...n, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Mínimo</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProducto.precioMin}
                      onChange={e => setNuevoProducto(n => ({ ...n, precioMin: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Máximo</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProducto.precioMax}
                      onChange={e => setNuevoProducto(n => ({ ...n, precioMax: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Actual</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProducto.precioActual}
                      onChange={e => setNuevoProducto(n => ({ ...n, precioActual: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidad</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoProducto.unidad}
                      onChange={e => setNuevoProducto(n => ({ ...n, unidad: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowNewProducto(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de firma */}
      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Firma {signatureType.charAt(0).toUpperCase() + signatureType.slice(1)}
            </h3>
            <div className="mb-4">
              <canvas
                ref={canvasRef}
                className="w-full h-32 border rounded"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={clearSignature}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={saveSignature}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Ticket Button - Solo para pruebas */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => {
            if (purchases.length === 0) return alert('No hay compras para generar ticket.');
            const ticketData = generatePurchaseTicketData(purchases[0]);
            console.log('Datos del ticket de compra:', ticketData);
            alert('Datos del ticket de compra generados en consola.');
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CreditCard className="h-5 w-5" />
          <span>Generar Ticket de Compra</span>
        </button>
      </div>
    </div>
  );
};

export default Purchases;

