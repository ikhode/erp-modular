import React, {useState} from 'react';
import {Cog, CreditCard as Edit, Plus, Search, Trash2} from 'lucide-react';
import type {LocationType, Proceso, ProcessItem, Producto} from '../lib/db';
import {db} from '../lib/db';
import ProductFormModal from './ProductFormModal';

// Fragmento reutilizable para renderizar lista de insumos/outputs
function ProcessItemList({ items, color }: { items: ProcessItem[]; color: string }) {
  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className={`text-sm text-gray-600 ${color} p-2 rounded`}>
          {item.productName}: {item.unit}
        </div>
      ))}
    </div>
  );
}

const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<Proceso[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Proceso | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);

  // Nuevo estado para el paso actual del wizard de preguntas
  const [questionStep, setQuestionStep] = useState(1);
  // Estado para las respuestas del wizard
  const [wizardAnswers, setWizardAnswers] = useState({
    processName: '',
    processDescription: '',
    insumoTipo: '', // 'producto' | 'tipo'
    insumos: [] as ProcessItem[],
    mezcla: false,
    lugares: [] as string[],
    outputs: [] as string[],
  });
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  React.useEffect(() => {
    db.procesos.toArray().then(setProcesses);
    db.productos.toArray().then(setProductos);
    db.locationTypes.toArray().then(setLocationTypes);
  }, []);

  // Al editar, precargar datos
  React.useEffect(() => {
    if (editingProcess) {
      setEditingProcess(editingProcess);
      setShowModal(true);
    } else {
      setEditingProcess(null);
    }
  }, [editingProcess, showModal]);

  const filteredProcesses = processes.filter(process =>
    process.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (process.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (process: Proceso) => {
    setEditingProcess(process);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este proceso?')) {
      setProcesses(processes.filter(p => p.id !== id));
    }
  };

  // Guardar proceso (solo en memoria, adaptar a storage/db si es necesario)
  const handleSaveProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mapear insumos y outputs a objetos ProcessItem (ya son arrays de objetos simples)
    const inputs: ProcessItem[] = wizardAnswers.insumos;
    const outputs: ProcessItem[] = wizardAnswers.outputs.map(id => {
      const prod = productos.find(p => String(p.id) === id);
      return prod ? {
        modoProducto: 'producto',
        productId: String(prod.id),
        productName: prod.nombre,
        unit: prod.unidad,
        modoUbicacion: 'tipo',
        tipoUbicacion: undefined,
        ubicacionId: undefined,
      } : null;
    }).filter(Boolean) as ProcessItem[];
    // Solo los campos del modelo Proceso
    const newProcess: Proceso = {
      nombre: wizardAnswers.processName,
      descripcion: wizardAnswers.processDescription,
      ubicacionId: 0, // Ajustar según lógica de lugares
      requiereFaceAuth: false, // Ajustar según lógica
      tipo: '', // Ajustar según lógica o seleccionar de catálogo
      createdAt: new Date(),
      updatedAt: new Date(),
      inputs,
      outputs,
      reglas: { mezcla: wizardAnswers.mezcla, lugares: wizardAnswers.lugares },
    };
    await db.procesos.add(newProcess);
    const all = await db.procesos.toArray();
    setProcesses(all);
    setShowModal(false);
    setEditingProcess(null);
  };

  // Render del wizard por pasos
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
                <h3 className="text-lg font-semibold text-gray-900">{process.nombre}</h3>
                <p className="text-sm text-gray-600">{process.descripcion}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(process)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(process.id!)}
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
                <ProcessItemList items={process.inputs} color="bg-red-50" />
              </div>

              {/* Outputs */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Generados</h4>
                <ProcessItemList items={process.outputs} color="bg-green-50" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear/editar proceso */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative"
            style={{ maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative', boxSizing: 'border-box' }}
          >
            {/* Botón X para cerrar */}
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => { setShowModal(false); setEditingProcess(null); }}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProcess ? 'Editar Proceso' : 'Nuevo Proceso'}
            </h3>
            {/* Wizard de preguntas guiadas */}
            <form onSubmit={handleSaveProcess}>
              {questionStep === 1 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué proceso deseas crear?</label>
                  <input type="text" className="w-full border rounded px-2 py-1" value={wizardAnswers.processName} onChange={e => setWizardAnswers(a => ({...a, processName: e.target.value}))} required autoFocus />
                  <div className="text-xs text-gray-500">
                    {wizardAnswers.processName.trim()
                      ? `El nombre será visible en reportes y tickets. Ejemplo: "Destopado", "Empaque", "Mezcla".`
                      : 'Ejemplo: Destopado, Empaque, Mezcla, etc.'}
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" disabled={!wizardAnswers.processName.trim()} onClick={() => setQuestionStep(2)}>Siguiente</button>
                  </div>
                </div>
              )}
              {questionStep === 2 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué insumos requiere este proceso?</label>
                  <div className="flex space-x-4">
                    <button type="button" className={`py-2 px-4 rounded-lg border ${wizardAnswers.insumoTipo==='producto'?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={() => setWizardAnswers(a => ({...a, insumoTipo: 'producto'}))}>Productos específicos</button>
                    <button type="button" className={`py-2 px-4 rounded-lg border ${wizardAnswers.insumoTipo==='tipo'?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={() => setWizardAnswers(a => ({...a, insumoTipo: 'tipo'}))}>Tipos de producto</button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {wizardAnswers.insumoTipo === 'producto' && 'Podrás seleccionar productos concretos (ejemplo: Coco bueno, Coco desecho). Esto permite un control detallado de inventario y trazabilidad por producto.'}
                    {wizardAnswers.insumoTipo === 'tipo' && 'Podrás seleccionar categorías o tipos de producto (ejemplo: Coco). Esto permite flexibilidad para procesos que aceptan cualquier producto de un tipo.'}
                    {!wizardAnswers.insumoTipo && 'Puedes elegir productos concretos o tipos de producto (ejemplo: Coco bueno, Coco desecho, o solo Coco).'}
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg" onClick={() => setQuestionStep(1)}>Anterior</button>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" disabled={!wizardAnswers.insumoTipo} onClick={() => setQuestionStep(3)}>Siguiente</button>
                  </div>
                </div>
              )}
              {questionStep === 3 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Se pueden mezclar insumos?</label>
                  <div className="flex space-x-4">
                    <button type="button" className={`py-2 px-4 rounded-lg border ${wizardAnswers.mezcla?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={() => setWizardAnswers(a => ({...a, mezcla: true}))}>Sí</button>
                    <button type="button" className={`py-2 px-4 rounded-lg border ${!wizardAnswers.mezcla?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={() => setWizardAnswers(a => ({...a, mezcla: false}))}>No</button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {wizardAnswers.mezcla && 'Permitir mezcla significa que el proceso podrá consumir insumos de diferentes productos/tipos en una sola operación (ejemplo: Coco bueno y Coco desecho juntos). Esto puede facilitar la operación pero reduce la trazabilidad individual.'}
                    {!wizardAnswers.mezcla && 'No permitir mezcla obliga a que cada operación consuma insumos de un solo producto/tipo a la vez. Esto mejora la trazabilidad y control, pero puede requerir más registros.'}
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg" onClick={() => setQuestionStep(2)}>Anterior</button>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" onClick={() => setQuestionStep(4)}>Siguiente</button>
                  </div>
                </div>
              )}
              {questionStep === 4 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿De dónde se tomarán los insumos?</label>
                  <select className="w-full border rounded px-2 py-1" multiple value={wizardAnswers.lugares} onChange={e => setWizardAnswers(a => ({...a, lugares: Array.from(e.target.selectedOptions, o => o.value)}))}>
                    {locationTypes.map(type => (
                      <option key={type.id} value={String(type.id)}>{type.name}</option>
                    ))}
                    <option value="__new__">+ Crear nuevo tipo de lugar</option>
                  </select>
                  <div className="text-xs text-gray-500">
                    {wizardAnswers.lugares.length === 0 && 'Selecciona uno o varios tipos de lugar, o crea uno nuevo.'}
                    {wizardAnswers.lugares.length > 0 && `Has seleccionado ${wizardAnswers.lugares.length} tipo(s) de lugar. Esto determinará de dónde se descuentan los insumos en inventario.`}
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg" onClick={() => setQuestionStep(3)}>Anterior</button>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" disabled={wizardAnswers.lugares.length===0} onClick={() => setQuestionStep(5)}>Siguiente</button>
                  </div>
                </div>
              )}
              {questionStep === 5 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué productos genera este proceso?</label>
                  <select className="w-full border rounded px-2 py-1" multiple value={wizardAnswers.outputs} onChange={e => {
                    const val = Array.from(e.target.selectedOptions, o => o.value);
                    if (val.includes('__new__')) {
                      setShowNewProductModal(true);
                      setWizardAnswers(a => ({...a, outputs: a.outputs.filter(v => v !== '__new__')}));
                    } else {
                      setWizardAnswers(a => ({...a, outputs: val}));
                    }
                  }}>
                    {productos.filter(p => p.procesoSalida).map(p => (
                      <option key={p.id} value={String(p.id)}>{p.nombre} ({p.unidad})</option>
                    ))}
                    <option value="__new__">+ Crear nuevo producto</option>
                  </select>
                  <div className="text-xs text-gray-500">
                    {wizardAnswers.outputs.length === 0 && 'Selecciona uno o varios productos generados, o crea uno nuevo.'}
                    {wizardAnswers.outputs.length > 0 && `Has seleccionado ${wizardAnswers.outputs.length} producto(s) generados. Esto determinará qué se agregará al inventario al finalizar el proceso.`}
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg" onClick={() => setQuestionStep(4)}>Anterior</button>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-lg" disabled={wizardAnswers.outputs.length===0} onClick={() => setQuestionStep(6)}>Siguiente</button>
                  </div>
                  {/* Modal para crear nuevo producto reutilizando ProductFormModal */}
                  {showNewProductModal && (
                    <ProductFormModal
                      open={showNewProductModal}
                      onClose={() => setShowNewProductModal(false)}
                      onCreated={nuevoProducto => {
                        setProductos(prev => [...prev, nuevoProducto]);
                        setWizardAnswers(a => ({...a, outputs: [...a.outputs, String(nuevoProducto.id)]}));
                        setShowNewProductModal(false);
                      }}
                    />
                  )}
                </div>
              )}
              {questionStep === 6 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resumen del proceso</label>
                  <div className="bg-gray-50 p-4 rounded">
                    <div><b>Nombre:</b> {wizardAnswers.processName}</div>
                    <div><b>Insumos:</b> {wizardAnswers.insumoTipo === 'producto' ? 'Productos específicos' : 'Tipos de producto'} {wizardAnswers.mezcla ? '(mezcla permitida)' : '(no mezcla)'}</div>
                    <div><b>Lugares:</b> {wizardAnswers.lugares.map(id => productos.find(t => String(t.id) === id)?.nombre).join(', ')}</div>
                    <div><b>Generados:</b> {wizardAnswers.outputs.map(id => productos.find(p => String(p.id) === id)?.nombre).join(', ')}</div>
                  </div>
                  <div className="flex justify-between mt-4 gap-2">
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" onClick={() => { setShowModal(false); setEditingProcess(null); }}>Cancelar</button>
                    <button type="button" className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg" onClick={() => setQuestionStep(5)}>Anterior</button>
                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg">Guardar proceso</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Processes;

