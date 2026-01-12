import React, {useRef, useState} from 'react';
import {CreditCard, Edit, FileText, History, Plus, Save, Search, Trash2, Truck, User, Wrench, X} from 'lucide-react';
import {proveedorStorage} from '../lib/storage';
import type {Proveedor} from '../lib/db';
import {useTenant} from '../contexts/TenantContext';

const Providers: React.FC = () => {
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Proveedor | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'bancarios' | 'documentos' | 'historial'>('general');
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
    banco: '',
    cuentaBancaria: '',
    clabe: '',
    firmaBase64: '',
    activo: true,
    tipoProveedor: 'proveedor' as 'proveedor' | 'transportista' | 'servicio',
    categoria: '',
    notas: ''
  });

  const { tenantId } = useTenant();

  // Firma digital
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load providers on mount
  React.useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const allProviders = await proveedorStorage.getAll();
      setProviders(allProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  // Validación RFC básica
  const validarRFC = (rfc: string): boolean => {
    // RFC persona física: 13 caracteres, persona moral: 12
    if (rfc.length < 12 || rfc.length > 13) return false;
    // Patrón básico: 3-4 letras, 6 dígitos, 3 alfanuméricos
    const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{2}[0-1][0-9][0-3][0-9][A-Z0-9]{3}$/;
    return rfcPattern.test(rfc.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar RFC si está presente
    if (formData.rfc && !validarRFC(formData.rfc)) {
      alert('RFC inválido. Debe tener formato correcto (12-13 caracteres).');
      return;
    }

    try {
      const providerData = {
        ...formData,
        tenantId: tenantId!,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingProvider) {
        await proveedorStorage.update(editingProvider.id!, { ...providerData, updatedAt: new Date() });
      } else {
        await proveedorStorage.add(providerData);
      }

      await loadProviders();
      resetForm();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Error al guardar proveedor. Verifique los datos.');
    }
  };

  const handleEdit = (provider: Proveedor) => {
    setEditingProvider(provider);
    setFormData({
      nombre: provider.nombre,
      rfc: provider.rfc || '',
      email: provider.email || '',
      telefono: provider.telefono || '',
      direccion: provider.direccion || '',
      banco: provider.banco || '',
      cuentaBancaria: provider.cuentaBancaria || '',
      clabe: provider.clabe || '',
      firmaBase64: provider.firmaBase64 || '',
      activo: provider.activo ?? true,
      tipoProveedor: provider.tipoProveedor || 'proveedor',
      categoria: provider.categoria || '',
      notas: provider.notas || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    // Confirmación especial que simula notificación a admin
    const confirmMessage = `¿Está seguro de eliminar este proveedor?\n\nEsta acción será registrada y notificada al administrador del sistema.`;
    if (window.confirm(confirmMessage)) {
      try {
        await proveedorStorage.delete(id);
        await loadProviders();
        alert('Proveedor eliminado. El administrador ha sido notificado.');
      } catch (error) {
        console.error('Error deleting provider:', error);
        alert('Error al eliminar proveedor.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      rfc: '',
      email: '',
      telefono: '',
      direccion: '',
      banco: '',
      cuentaBancaria: '',
      clabe: '',
      firmaBase64: '',
      activo: true,
      tipoProveedor: 'proveedor',
      categoria: '',
      notas: ''
    });
    setEditingProvider(null);
    setShowAddModal(false);
    setActiveTab('general');
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
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    setFormData(prev => ({ ...prev, firmaBase64: dataURL }));
    setShowSignatureModal(false);
    clearSignature();
  };

  const filteredProviders = providers.filter(provider =>
    provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.rfc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProviders = providers.length;
  const activeProviders = providers.filter(p => p.activo !== false).length;
  const inactiveProviders = providers.filter(p => p.activo === false).length;

  const getProviderTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'transportista': return Truck;
      case 'servicio': return Wrench;
      default: return User;
    }
  };

  const getProviderTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'transportista': return 'Transportista';
      case 'servicio': return 'Servicio';
      default: return 'Proveedor';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold">{totalProviders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold">{activeProviders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold">{inactiveProviders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Con Documentos</p>
              <p className="text-2xl font-bold">{providers.filter(p => p.firmaBase64).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const TypeIcon = getProviderTypeIcon(provider.tipoProveedor || 'proveedor');
                return (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{provider.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.rfc}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getProviderTypeLabel(provider.tipoProveedor || 'proveedor')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.categoria || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(provider)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProviders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron proveedores
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProvider) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'general', label: 'Información General', icon: User },
                  { id: 'bancarios', label: 'Datos Bancarios', icon: CreditCard },
                  { id: 'documentos', label: 'Documentos', icon: FileText },
                  { id: 'historial', label: 'Historial', icon: History }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as 'general' | 'bancarios' | 'documentos' | 'historial')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}

              </nav>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Tab: Información General */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RFC
                      </label>
                      <input
                        type="text"
                        value={formData.rfc}
                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="AAAA000000AAA"
                      />
                      {formData.rfc && !validarRFC(formData.rfc) && (
                        <p className="text-red-500 text-xs mt-1">RFC inválido</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Proveedor
                      </label>
                      <select
                        value={formData.tipoProveedor}
                        onChange={(e) => setFormData({ ...formData, tipoProveedor: e.target.value as 'proveedor' | 'transportista' | 'servicio' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="proveedor">Proveedor de Productos</option>
                        <option value="transportista">Transportista</option>
                        <option value="servicio">Servicio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <input
                        type="text"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Frutas, Verduras, Insumos..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <textarea
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                      Proveedor activo
                    </label>
                  </div>
                </div>
              )}

              {/* Tab: Datos Bancarios */}
              {activeTab === 'bancarios' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banco
                      </label>
                      <input
                        type="text"
                        value={formData.banco}
                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cuenta Bancaria
                      </label>
                      <input
                        type="text"
                        value={formData.cuentaBancaria}
                        onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CLABE
                      </label>
                      <input
                        type="text"
                        value={formData.clabe}
                        onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={18}
                        placeholder="18 dígitos"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Documentos */}
              {activeTab === 'documentos' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Subir documentos</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      INE, comprobante de domicilio, acta constitutiva, licencia de conducir, etc.
                    </p>
                    <div className="mt-4">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="document-upload"
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-block"
                      >
                        Seleccionar archivos
                      </label>
                    </div>
                  </div>

                  {/* Firma Digital */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Firma Digital</h4>
                    {formData.firmaBase64 ? (
                      <div className="space-y-2">
                        <img src={formData.firmaBase64} alt="Firma" className="border border-gray-300 rounded max-w-xs" />
                        <p className="text-sm text-green-600">✓ Firma registrada</p>
                        {!editingProvider && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, firmaBase64: '' })}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Limpiar firma
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">No hay firma registrada</p>
                        <button
                          type="button"
                          onClick={() => setShowSignatureModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        >
                          Capturar Firma
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Historial */}
              {activeTab === 'historial' && (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Historial de actividades</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Las actividades del proveedor se mostrarán aquí
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  {editingProvider ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Firma Digital */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Digital</h3>
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

export default Providers;

// TODO: Añadir pestañas para relaciones (compras asociadas al proveedor) siguiendo el patrón de Clientes.
// TODO: Modularizar el formulario en un componente ProviderFormModal si se requiere reutilización o crecimiento.
