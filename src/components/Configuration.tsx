import React, {useEffect, useState} from 'react';
import {AlertTriangle, Calendar, Database, Plus, Save, Settings, Trash2} from 'lucide-react';
import {safeStorage} from '../lib/safeStorage';
import {storage} from '../lib/storage';
import type {
    Attendance,
    CashFlow,
    Cliente,
    Compra,
    Empleado,
    FolioSequence,
    Inventario,
    LocationType,
    Proceso,
    ProduccionTicket,
    Producto,
    Proveedor,
    Transfer,
    Ubicacion,
    UserRole,
    Venta
} from '../lib/db';

const CONFIG_KEY = 'erp_config';

const defaultConfig = {
  general: {
    companyName: 'Fábrica de Coco Los Cocos',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    language: 'es',
  },
  pricing: {
    minPurchasePrice: 0,
    maxPurchasePrice: 1000,
    minSalePrice: 0,
    maxSalePrice: 2000,
    defaultMargin: 30,
  },
  processes: [
    { id: 1, name: 'Destopado', paymentType: 'por_procesado', rate: 2.5, unit: 'kg' },
    { id: 2, name: 'Deshuesado', paymentType: 'por_generado', rate: 3.0, unit: 'kg' },
    { id: 3, name: 'Pelado', paymentType: 'por_procesado', rate: 1.8, unit: 'kg' },
    { id: 4, name: 'Extracción Copra', paymentType: 'por_generado', rate: 5.0, unit: 'kg' },
  ],
  modules: {
    purchases: true,
    sales: true,
    inventory: true,
    production: true,
    payroll: true,
    reports: true,
    faceAuth: true,
  },
  testData: {
    enabled: false,
    lastCreated: null as string | null,
  },
  periodClosures: {
    enabled: true,
    frequency: 'monthly', // 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
    autoClose: false,
    closeDay: 1, // Día del mes para cierre mensual, día de la semana para semanal, etc.
  }
};

const industries = [
  { id: 'fabrica_coco', name: 'Fábrica de Coco', description: 'Procesamiento de coco para obtener pulpa, copra y aceite' },
  { id: 'fabrica_cafe', name: 'Fábrica de Café', description: 'Tostado y molienda de café premium' },
  { id: 'fabrica_textil', name: 'Fábrica Textil', description: 'Producción de telas y prendas de vestir' },
  { id: 'fabrica_alimentos', name: 'Fábrica de Alimentos', description: 'Procesamiento de alimentos diversos' }
];

// Definición de tipo para la configuración ERP
export type ERPConfig = typeof defaultConfig;

// Utilidad para acceder a tablas de storage de forma tipada
function getTable<K extends keyof typeof storage>(tableName: K): typeof storage[K] {
  return storage[tableName];
}

const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [testDataLoading, setTestDataLoading] = useState(false);
  const [testDataMessage, setTestDataMessage] = useState('');
  const [testDataCounts, setTestDataCounts] = useState<Record<string, number>>({});
  const [selectedIndustry, setSelectedIndustry] = useState('fabrica_coco');

    // Cargar configuración persistente al montar
    useEffect(() => {
    const stored = safeStorage.get(CONFIG_KEY, {}) as Partial<ERPConfig>;
    const mergedConfig: ERPConfig = {
      ...defaultConfig,
      ...stored,
      general: { ...defaultConfig.general, ...(stored.general ?? {}) },
      pricing: { ...defaultConfig.pricing, ...(stored.pricing ?? {}) },
      modules: { ...defaultConfig.modules, ...(stored.modules ?? {}) },
      testData: { ...defaultConfig.testData, ...(stored.testData ?? {}) },
      processes: stored.processes ?? defaultConfig.processes,
      periodClosures: { ...defaultConfig.periodClosures, ...(stored.periodClosures ?? {}) },
    };
    setConfig(mergedConfig);

    // Si hay datos de prueba activos, contar los registros
    if (mergedConfig.testData.enabled) {
      countTestDataRecords();
    }
    }, []);

    const createTestData = async () => {
      try {
        setTestDataLoading(true);
        setTestDataMessage('Creando datos de prueba...');

        // Eliminar datos existentes para evitar conflictos
        await deleteTestDataSilently();

        // Cargar datos demo desde archivos separados según la industria seleccionada
        const demoData: Record<string, unknown[]> = {};
        // Determinar carpeta según industria
        const industryFolder = selectedIndustry;
        // Leer archivos de la carpeta correspondiente
        const tablesToLoad = [
          'userRoles',
          'locationTypes',
          'folioSequences',
          'clientes',
          'proveedores',
          'productos',
          'ubicaciones',
          'procesos',
          'empleados',
          'inventario',
          'compras',
          'ventas',
          'produccionTickets',
          'transfers',
          'attendance',
          'cashFlow',
          'syncQueue'
        ];
        for (const tableName of tablesToLoad) {
          try {
            const response = await fetch(`/demo_data_coco_factory/${industryFolder}/${tableName}.json`);
            if (response.ok) {
              demoData[tableName] = await response.json();
            } else {
              demoData[tableName] = [];
            }
          } catch {
            demoData[tableName] = [];
          }
        }
        // Insertar datos en orden para respetar las foreign keys
        const tablesOrder = [
          'userRoles',
          'locationTypes',
          'folioSequences',
          'clientes',
          'proveedores',
          'productos',
          'ubicaciones',
          'procesos',
          'empleados',
          'inventario',
          'compras',
          'ventas',
          'produccionTickets',
          'transfers',
          'attendance',
          'cashFlow',
          'syncQueue'
        ];
        for (const tableName of tablesOrder) {
          if (demoData[tableName] && demoData[tableName].length > 0) {
            switch (tableName) {
              case 'clientes':
                await storage.clientes.addMany(demoData[tableName] as Cliente[]);
                break;
              case 'proveedores':
                await storage.proveedores.addMany(demoData[tableName] as Proveedor[]);
                break;
              case 'productos':
                await storage.productos.addMany(demoData[tableName] as Producto[]);
                break;
              case 'empleados':
                await storage.empleados.addMany(demoData[tableName] as Empleado[]);
                break;
              case 'ubicaciones':
                await storage.ubicaciones.addMany(demoData[tableName] as Ubicacion[]);
                break;
              case 'procesos':
                await storage.procesos.addMany(demoData[tableName] as Proceso[]);
                break;
              case 'inventario':
                await storage.inventario.addMany(demoData[tableName] as Inventario[]);
                break;
              case 'produccionTickets':
                await storage.produccionTickets.addMany(demoData[tableName] as ProduccionTicket[]);
                break;
              case 'compras':
                await storage.compras.addMany(demoData[tableName] as Compra[]);
                break;
              case 'ventas':
                await storage.ventas.addMany(demoData[tableName] as Venta[]);
                break;
              case 'cashFlow':
                await storage.cashFlow.addMany(demoData[tableName] as CashFlow[]);
                break;
              case 'userRoles':
                await storage.userRoles.addMany(demoData[tableName] as UserRole[]);
                break;
              case 'locationTypes':
                await storage.locationTypes.addMany(demoData[tableName] as LocationType[]);
                break;
              case 'transfers':
                await storage.transfers.addMany(demoData[tableName] as Transfer[]);
                break;
              case 'attendance':
                await storage.attendance.addMany(demoData[tableName] as Attendance[]);
                break;
              case 'folioSequences':
                await storage.folioSequences.addMany(demoData[tableName] as FolioSequence[]);
                break;
            }
          }
        }

        // Contar registros después de crearlos
        await countTestDataRecords();

        // Actualizar configuración
        setConfig(prev => ({
          ...prev,
          testData: {
            enabled: true,
            lastCreated: new Date().toISOString()
          }
        }));

        setTestDataMessage('Datos de prueba creados exitosamente');
        setTimeout(() => setTestDataMessage(''), 3000);
      } catch {
        setTestDataMessage('Error al crear datos de prueba');
        setTimeout(() => setTestDataMessage(''), 3000);
      } finally {
        setTestDataLoading(false);
      }
    };

    const deleteTestDataSilently = async () => {
      try {
        // Eliminar datos en orden inverso para evitar conflictos de foreign keys
        const tablesToClear = [
          'cashFlow',
          'attendance',
          'transfers',
          'produccionTickets',
          'ventas',
          'compras',
          'inventario',
          'empleados',
          'procesos',
          'ubicaciones',
          'productoConfigs',
          'productoVariaciones',
          'productos',
          'proveedores',
          'clientes',
          'folioSequences',
          'locationTypes',
          'userRoles',
          'syncQueue'
        ];

        for (const tableName of tablesToClear) {
          const table = getTable(tableName as keyof typeof storage);
          if (table && typeof table.clearAll === 'function') {
            try {
              await table.clearAll();
            } catch {
              // Silenciar error
            }
          }
        }
      } catch {
        // Silenciar error
      }
    };

    const countTestDataRecords = async () => {
      try {
        const counts: Record<string, number> = {};

        // Contar registros de cada tabla
        const tablesToCount = [
          'userRoles',
          'locationTypes',
          'folioSequences',
          'clientes',
          'proveedores',
          'productos',
          'ubicaciones',
          'procesos',
          'empleados',
          'inventario',
          'compras',
          'ventas',
          'produccionTickets',
          'transfers',
          'attendance',
          'cashFlow',
          'syncQueue'
        ];

        for (const tableName of tablesToCount) {
          const table = getTable(tableName as keyof typeof storage);
          if (table && typeof table.countAll === 'function') {
            counts[tableName] = await table.countAll();
          } else {
            counts[tableName] = 0;
          }
        }

        setTestDataCounts(counts);
      } catch {
        // Silenciar error
      }
    };

    const deleteTestData = async () => {
      try {
        setTestDataLoading(true);
        setTestDataMessage('Eliminando datos de prueba...');

        // Eliminar datos en orden inverso para evitar conflictos de foreign keys
        const tablesToClear = [
          'cashFlow',
          'attendance',
          'transfers',
          'produccionTickets',
          'ventas',
          'compras',
          'inventario',
          'empleados',
          'procesos',
          'ubicaciones',
          'productoConfigs',
          'productoVariaciones',
          'productos',
          'proveedores',
          'clientes',
          'folioSequences',
          'locationTypes',
          'userRoles',
          'syncQueue'
        ];

        for (const tableName of tablesToClear) {
          const table = getTable(tableName as keyof typeof storage);
          if (table && typeof table.clearAll === 'function') {
            await table.clearAll();
          }
        }

        // Actualizar configuración
        setConfig(prev => ({
          ...prev,
          testData: {
            enabled: false,
            lastCreated: null
          }
        }));

        setTestDataMessage('Datos de prueba eliminados exitosamente');
        setTimeout(() => setTestDataMessage(''), 3000);
      } catch {
        setTestDataMessage('Error al eliminar datos de prueba');
        setTimeout(() => setTestDataMessage(''), 3000);
      } finally {
        setTestDataLoading(false);
      }
    };

    const handleTestDataToggle = async (enabled: boolean) => {
    if (enabled) {
      await createTestData();
    } else {
      await deleteTestData();
    }
    };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'pricing', label: 'Precios', icon: Settings },
    { id: 'processes', label: 'Procesos', icon: Settings },
    { id: 'periodClosures', label: 'Cierres de Periodo', icon: Calendar },
    { id: 'locations', label: 'Ubicaciones', icon: Settings },
    { id: 'modules', label: 'Módulos', icon: Settings },
    { id: 'testData', label: 'Datos de Prueba', icon: Database },
  ];

  const handleSave = () => {
    safeStorage.set(CONFIG_KEY, config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addProcess = () => {
    const newProcess = {
      id: Date.now(),
      name: '',
      paymentType: 'por_procesado',
      rate: 0,
      unit: 'kg'
    };
    setConfig({
      ...config,
      processes: [...config.processes, newProcess]
    });
  };

  const updateProcess = (id: number, field: string, value: string | number | boolean) => {
    setConfig({
      ...config,
      processes: config.processes.map(process =>
        process.id === id ? { ...process, [field]: value } : process
      )
    });
  };

  const deleteProcess = (id: number) => {
    setConfig({
      ...config,
      processes: config.processes.filter(process => process.id !== id)
    });
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa
          </label>
          <input
            type="text"
            value={config.general.companyName}
            onChange={(e) => setConfig({
              ...config,
              general: { ...config.general, companyName: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            value={config.general.currency}
            onChange={(e) => setConfig({
              ...config,
              general: { ...config.general, currency: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPricingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio Mínimo de Compra
          </label>
          <input
            type="number"
            value={config.pricing.minPurchasePrice}
            onChange={(e) => setConfig({
              ...config,
              pricing: { ...config.pricing, minPurchasePrice: Number(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio Máximo de Compra
          </label>
          <input
            type="number"
            value={config.pricing.maxPurchasePrice}
            onChange={(e) => setConfig({
              ...config,
              pricing: { ...config.pricing, maxPurchasePrice: Number(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderProcessesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Procesos de Producción</h3>
        <button
          onClick={addProcess}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Proceso</span>
        </button>
      </div>

      <div className="space-y-4">
        {config.processes.map((process) => (
          <div key={process.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proceso
                </label>
                <input
                  type="text"
                  value={process.name}
                  onChange={(e) => updateProcess(process.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pago
                </label>
                <select
                  value={process.paymentType}
                  onChange={(e) => updateProcess(process.id, 'paymentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="por_procesado">Por Procesado</option>
                  <option value="por_generado">Por Generado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarifa
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={process.rate}
                  onChange={(e) => updateProcess(process.id, 'rate', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  value={process.unit}
                  onChange={(e) => updateProcess(process.id, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="kg">Kilogramos</option>
                  <option value="l">Litros</option>
                  <option value="pz">Piezas</option>
                </select>
              </div>
              <div>
                <button
                  onClick={() => deleteProcess(process.id)}
                  className="w-full bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLocationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Ubicaciones</h3>
        <button
          onClick={() => {}}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Ubicación</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Aquí puedes mapear las ubicaciones existentes en la configuración */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Ubicación
              </label>
              <input
                type="text"
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ubicación
              </label>
              <select
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="almacen">Almacén</option>
                <option value="tienda">Tienda</option>
                <option value="oficina">Oficina</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModulesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Módulos del Sistema</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(config.modules).map(([module, enabled]) => (
          <label key={module} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setConfig({
                ...config,
                modules: { ...config.modules, [module]: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-gray-900 capitalize">
                {module.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm text-gray-500">
                {module === 'faceAuth' ? 'Autenticación facial' : `Módulo de ${module}`}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderTestDataTab = () => {
    const selectedIndustryData = industries.find(ind => ind.id === selectedIndustry);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Datos de Prueba</h3>

        {testDataMessage && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            testDataMessage.includes('Error') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {testDataMessage}
          </div>
        )}

        {/* Selector de Industria */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Selecciona el tipo de industria</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {industries.map((industry) => (
              <label key={industry.id} className="relative">
                <input
                  type="radio"
                  name="industry"
                  value={industry.id}
                  checked={selectedIndustry === industry.id}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="sr-only peer"
                />
                <div className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedIndustry === industry.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="font-medium text-sm">{industry.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{industry.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Datos de Prueba</span>
              <p className="text-xs text-gray-500">
                {config.testData.enabled
                  ? `Datos de prueba activos (${selectedIndustryData?.name}) - Desactiva para eliminar todos los datos ficticios`
                  : `Activa para crear datos ficticios de prueba para ${selectedIndustryData?.name?.toLowerCase()}`
                }
              </p>
              {config.testData.lastCreated && (
                <p className="text-xs text-blue-600 mt-1">
                  Última creación: {new Date(config.testData.lastCreated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {config.testData.enabled ? 'Activado' : 'Desactivado'}
              </span>
              <button
                onClick={() => handleTestDataToggle(!config.testData.enabled)}
                disabled={testDataLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.testData.enabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${testDataLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.testData.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {config.testData.enabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Advertencia</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Los datos de prueba incluyen productos ficticios, ubicaciones y registros de inventario.
                  Al desactivar, se eliminarán todos estos datos. Asegúrate de no tener datos reales importantes.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Datos incluidos en {selectedIndustryData?.name?.toLowerCase()}:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-blue-700 mb-1">🏭 Operaciones</h5>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• {testDataCounts.clientes || 0} Clientes (mayoristas, minoristas)</li>
                <li>• {testDataCounts.proveedores || 0} Proveedores (fincas, transporte)</li>
                <li>• {testDataCounts.productos || 0} Productos ({selectedIndustry === 'fabrica_coco' ? 'coco, pulpa, copra, aceite' : selectedIndustry === 'fabrica_cafe' ? 'café verde, tostado, molido' : 'productos diversos'})</li>
                <li>• {testDataCounts.empleados || 0} Empleados (roles diversos)</li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-blue-700 mb-1">📦 Inventario & Producción</h5>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• {testDataCounts.ubicaciones || 0} Ubicaciones (patios, almacenes)</li>
                <li>• {testDataCounts.procesos || 0} Procesos de producción</li>
                <li>• {testDataCounts.inventario || 0} Registros de inventario</li>
                <li>• {testDataCounts.compras || 0} Compras activas</li>
                <li>• {testDataCounts.ventas || 0} Ventas completadas</li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-blue-700 mb-1">💰 Finanzas</h5>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• {testDataCounts.cashFlow || 0} Movimientos de caja</li>
                <li>• {testDataCounts.produccionTickets || 0} Tickets de producción</li>
                <li>• {testDataCounts.transfers || 0} Transferencias</li>
                <li>• {testDataCounts.attendance || 0} Registros de asistencia</li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-blue-700 mb-1">⚙️ Sistema</h5>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• {testDataCounts.userRoles || 0} Roles de usuario</li>
                <li>• {testDataCounts.locationTypes || 0} Tipos de ubicación</li>
                <li>• {testDataCounts.folioSequences || 0} Secuencias de folio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodClosuresTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Configuración de Cierres de Periodo</h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Los cierres de periodo permiten automatizar el cierre de operaciones contables y de inventario
          en intervalos regulares. Esto asegura la integridad de los datos y facilita el análisis financiero.
        </p>
      </div>

      <div className="space-y-6">
        {/* Habilitar/Deshabilitar */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Habilitar Cierres de Periodo</h4>
            <p className="text-sm text-gray-600">Activar el sistema de cierres automáticos</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.periodClosures.enabled}
              onChange={(e) => setConfig({
                ...config,
                periodClosures: { ...config.periodClosures, enabled: e.target.checked }
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {config.periodClosures.enabled && (
          <>
            {/* Frecuencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Cierre
                </label>
                <select
                  value={config.periodClosures.frequency}
                  onChange={(e) => setConfig({
                    ...config,
                    periodClosures: { ...config.periodClosures, frequency: e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día de Cierre
                </label>
                <input
                  type="number"
                  min="1"
                  max={config.periodClosures.frequency === 'monthly' ? 31 :
                        config.periodClosures.frequency === 'weekly' ? 7 :
                        config.periodClosures.frequency === 'biweekly' ? 15 : 365}
                  value={config.periodClosures.closeDay}
                  onChange={(e) => setConfig({
                    ...config,
                    periodClosures: { ...config.periodClosures, closeDay: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config.periodClosures.frequency === 'monthly' && 'Día del mes (1-31)'}
                  {config.periodClosures.frequency === 'weekly' && 'Día de la semana (1=Lunes, 7=Domingo)'}
                  {config.periodClosures.frequency === 'biweekly' && 'Día del mes para quincena (1-15)'}
                  {config.periodClosures.frequency === 'yearly' && 'Día del año (1-365)'}
                  {config.periodClosures.frequency === 'quarterly' && 'Día del trimestre (1-90)'}
                  {config.periodClosures.frequency === 'daily' && 'No aplica (cierre diario)'}
                </p>
              </div>
            </div>

            {/* Cierre Automático */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Cierre Automático</h4>
                <p className="text-sm text-gray-600">Realizar cierres automáticamente según la frecuencia configurada</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.periodClosures.autoClose}
                  onChange={(e) => setConfig({
                    ...config,
                    periodClosures: { ...config.periodClosures, autoClose: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Información del Próximo Cierre */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Próximo Cierre Programado</h4>
              <div className="text-sm text-gray-600">
                <p>Frecuencia: <span className="font-medium capitalize">{config.periodClosures.frequency}</span></p>
                <p>Día: <span className="font-medium">{config.periodClosures.closeDay}</span></p>
                <p>Automático: <span className="font-medium">{config.periodClosures.autoClose ? 'Sí' : 'No'}</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'pricing':
        return renderPricingTab();
      case 'processes':
        return renderProcessesTab();
      case 'locations':
        return renderLocationsTab();
      case 'modules':
        return renderModulesTab();
      case 'testData':
        return renderTestDataTab();
      case 'periodClosures':
        return renderPeriodClosuresTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Guardar Cambios</span>
        </button>
      </div>
      {saved && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
          Configuración guardada correctamente
        </div>
      )}
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Configuration;

