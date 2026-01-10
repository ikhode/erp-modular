import React, {useEffect, useState} from 'react';
import {Plus, Save, Settings, Trash2} from 'lucide-react';
import {safeStorage} from '../lib/safeStorage';

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
  }
};

const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState(defaultConfig);
  const [saved, setSaved] = useState(false);

  // Cargar configuración persistente al montar
  useEffect(() => {
    const stored = safeStorage.get(CONFIG_KEY, defaultConfig);
    setConfig(stored);
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'pricing', label: 'Precios', icon: Settings },
    { id: 'processes', label: 'Procesos', icon: Settings },
    { id: 'modules', label: 'Módulos', icon: Settings },
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'pricing':
        return renderPricingTab();
      case 'processes':
        return renderProcessesTab();
      case 'modules':
        return renderModulesTab();
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

