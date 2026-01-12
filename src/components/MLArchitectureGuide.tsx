import React, {useState} from 'react';
import {
    AlertTriangle,
    Brain,
    Database,
    FileCode,
    Layers,
    Package,
    TrendingUp,
    Users,
    Workflow,
    Zap
} from 'lucide-react';

const MLArchitectureGuide = () => {
  const [activeTab, setActiveTab] = useState('architecture');
  const [selectedModule, setSelectedModule] = useState(null);

  const architectureLayers = [
    {
      id: 'api',
      name: 'API Layer',
      icon: Zap,
      color: 'bg-purple-500',
      description: 'Facade único para acceso a ML',
      files: ['MLService.ts', 'MLServiceFactory.ts'],
      responsibility: 'Punto de entrada único, validación de requests'
    },
    {
      id: 'registry',
      name: 'Model Registry',
      icon: Package,
      color: 'bg-blue-500',
      description: 'Gestión y orquestación de modelos',
      files: ['ModelRegistry.ts', 'ModelOrchestrator.ts'],
      responsibility: 'Registro, lifecycle, versionado de modelos'
    },
    {
      id: 'models',
      name: 'ML Models',
      icon: Brain,
      color: 'bg-green-500',
      description: 'Modelos especializados',
      files: ['BaseModel.ts', 'SalesPredictor.ts', 'DemandForecaster.ts', 'AnomalyDetector.ts'],
      responsibility: 'Implementación de algoritmos ML'
    },
    {
      id: 'features',
      name: 'Feature Engineering',
      icon: Workflow,
      color: 'bg-yellow-500',
      description: 'Pipeline de features',
      files: ['FeaturePipeline.ts', 'FeatureExtractors.ts', 'FeatureTransformers.ts'],
      responsibility: 'Extracción y transformación de features'
    },
    {
      id: 'preprocessing',
      name: 'Data Processing',
      icon: Layers,
      color: 'bg-orange-500',
      description: 'Preprocesamiento de datos',
      files: ['DataValidator.ts', 'DataNormalizer.ts', 'DataAugmenter.ts'],
      responsibility: 'Limpieza, validación, normalización'
    },
    {
      id: 'storage',
      name: 'Storage Layer',
      icon: Database,
      color: 'bg-red-500',
      description: 'Abstracción de almacenamiento',
      files: ['StorageAdapter.ts', 'ModelPersistence.ts', 'CacheManager.ts'],
      responsibility: 'Persistencia usando React state (NO localStorage)'
    }
  ];

  const innovativeFeatures = [
    {
      title: 'Predicción Multi-horizonte',
      description: 'Predicciones a corto (días), medio (semanas) y largo plazo (meses)',
      value: 'Planificación estratégica precisa',
      icon: TrendingUp
    },
    {
      title: 'Detección de Anomalías en Tiempo Real',
      description: 'Identifica patrones anormales en ventas, inventario, producción',
      value: 'Prevención de fraudes y errores operacionales',
      icon: AlertTriangle
    },
    {
      title: 'Recomendaciones Personalizadas',
      description: 'Sugerencias de productos, precios óptimos, mejores empleados',
      value: 'Aumento de conversión y eficiencia',
      icon: Users
    },
    {
      title: 'Auto-Reentrenamiento Adaptativo',
      description: 'Modelos que aprenden continuamente de nuevos datos',
      value: 'Precisión que mejora con el tiempo',
      icon: Brain
    }
  ];

  const codeExamples = {
    architecture: `// 📁 src/ml/core/MLService.ts export class MLService {   private registry: ModelRegistry;   private orchestrator: ModelOrchestrator;      async predict(modelType: ModelType, input: any): Promise<Prediction> {     const model = await this.registry.getModel(modelType);     const features = await this.featurePipeline.process(input);     return await this.orchestrator.predict(model, features);   } }`,
        storage: `// 📁 src/ml/infrastructure/StorageAdapter.ts // ✅ CORRECTO: Usar React state, NO localStorage export class StorageAdapter {   private modelStates = new Map<string, ModelState>();      async saveModel(name: string, state: ModelState): Promise<void> {     this.modelStates.set(name, state);     // Opcionalmente, emitir evento para que React actualice     this.notifyStateChange(name, state);   }      async loadModel(name: string): Promise<ModelState | null> {     return this.modelStates.get(name) || null;   } }`,
        features: `// 📁 src/ml/features/FeaturePipeline.ts export class FeaturePipeline {   private extractors: FeatureExtractor[];   private transformers: FeatureTransformer[];      async process(rawData: any): Promise<FeatureVector> {     let features = await this.extract(rawData);     features = await this.transform(features);     features = await this.validate(features);     return features;   } }`,
        models: `// 📁 src/ml/models/SalesPredictor.ts export class SalesPredictorModel extends BaseMLModel {   private featurePipeline: SalesFeaturePipeline;      async predict(input: SalesPredictionInput): Promise<SalesPrediction> {     const features = await this.featurePipeline.process(input);     const tensor = this.toTensor(features);     const result = await this.model.predict(tensor);     return this.postProcess(result, input);   } }`
  };

  const fileStructure = ` src/ml/ ├── core/ │   ├── MLService.ts           // API Principal │   ├── types.ts               // Types compartidos │   └── constants.ts           // Configuraciones │ ├── registry/ │   ├── ModelRegistry.ts       // Registro de modelos │   ├── ModelOrchestrator.ts   // Orquestación │   └── ModelMetadata.ts       // Metadata y versiones │ ├── models/ │   ├── base/ │   │   ├── BaseModel.ts       // Clase base abstracta │   │   └── ModelConfig.ts     // Configuración base │   │ │   ├── sales/ │   │   ├── SalesPredictor.ts │   │   └── SalesFeatures.ts │   │ │   ├── demand/ │   │   ├── DemandForecaster.ts │   │   └── DemandFeatures.ts │   │ │   └── anomaly/ │       ├── AnomalyDetector.ts │       └── AnomalyFeatures.ts │ ├── features/ │   ├── FeaturePipeline.ts     // Pipeline principal │   ├── extractors/ │   │   ├── TemporalExtractor.ts │   │   ├── CategoricalExtractor.ts │   │   └── NumericalExtractor.ts │   │ │   └── transformers/ │       ├── Normalizer.ts │       ├── Encoder.ts │       └── Scaler.ts │ ├── preprocessing/ │   ├── DataValidator.ts       // Validación │   ├── DataCleaner.ts         // Limpieza │   └── DataAugmenter.ts       // Augmentación │ ├── infrastructure/ │   ├── StorageAdapter.ts      // Abstracción storage │   ├── ModelPersistence.ts    // Persistencia modelos │   └── CacheManager.ts        // Cache en memoria │ └── utils/     ├── metrics.ts             // Métricas ML     ├── validators.ts          // Validadores     └── logger.ts              // Logger `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Sistema ML Modular
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Arquitectura de Machine Learning para ERP Empresarial
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['architecture', 'features', 'structure', 'code'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {tab === 'architecture' && 'Arquitectura'}
              {tab === 'features' && 'Features Innovadoras'}
              {tab === 'structure' && 'Estructura de Archivos'}
              {tab === 'code' && 'Ejemplos de Código'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Layers className="w-6 h-6 text-purple-400" />
                Capas de Arquitectura
              </h2>
              <p className="text-gray-300 mb-6">
                Sistema modular con separación de responsabilidades clara
              </p>

              <div className="space-y-4">
                {architectureLayers.map((layer, index) => {
                  const Icon = layer.icon;
                  return (
                    <div
                      key={layer.id}
                      className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedModule(selectedModule === layer.id ? null : layer.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${layer.color} p-3 rounded-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">{layer.name}</h3>
                            <span className="text-sm text-gray-500">Capa {index + 1}</span>
                          </div>
                          <p className="text-gray-400 mb-2">{layer.description}</p>
                          <p className="text-sm text-purple-300">
                            <strong>Responsabilidad:</strong> {layer.responsibility}
                          </p>

                          {selectedModule === layer.id && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              <p className="text-sm font-semibold text-gray-400 mb-2">Archivos:</p>
                              <div className="flex flex-wrap gap-2">
                                {layer.files.map(file => (
                                  <span
                                    key={file}
                                    className="px-3 py-1 bg-slate-800 rounded text-sm text-green-400 font-mono"
                                  >
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-red-300 mb-2">
                    ⚠️ CRÍTICO: NO usar localStorage
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Tu código actual usa <code className="bg-red-900/50 px-2 py-1 rounded">localStorage</code> en base.ts (líneas 62-87).
                    Esto <strong>NO funciona en Claude.ai artifacts</strong> y causará errores.
                  </p>
                  <div className="bg-slate-900/50 rounded p-3">
                    <p className="text-green-300 font-semibold mb-2">✅ Solución:</p>
                    <p className="text-gray-300">
                      Usa <strong>React state</strong> (useState, useReducer) o <strong>variables JavaScript en memoria</strong>.
                      Implementa un StorageAdapter que abstraiga esto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="grid md:grid-cols-2 gap-6">
            {innovativeFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 mb-3">{feature.description}</p>
                      <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                        <p className="text-sm text-green-300">
                          <strong>Valor:</strong> {feature.value}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileCode className="w-6 h-6 text-purple-400" />
              Estructura de Archivos Propuesta
            </h2>
            <pre className="bg-slate-900 rounded-lg p-6 overflow-x-auto text-sm">
              <code className="text-green-400">{fileStructure}</code>
            </pre>
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300">
                <strong>Principios:</strong> Cada archivo tiene un único propósito, máximo 200-300 líneas,
                alta cohesión, bajo acoplamiento.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            {Object.entries(codeExamples).map(([key, code]) => (
              <div
                key={key}
                className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/30"
              >
                <h3 className="text-xl font-bold mb-4 text-purple-300 capitalize">
                  {key === 'architecture' && '🏗️ Servicio Principal'}
                  {key === 'storage' && '💾 Storage Adapter (Correcto)'}
                  {key === 'features' && '⚙️ Feature Pipeline'}
                  {key === 'models' && '🧠 Modelo de Predicción'}
                </h3>
                <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-green-400">{code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-8 border border-purple-500/50">
          <h2 className="text-2xl font-bold mb-4">🚀 Próximos Pasos</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">1</span>
              <span>Implementar <strong>StorageAdapter</strong> sin localStorage</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">2</span>
              <span>Crear <strong>BaseModel</strong> abstracto y modular</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">3</span>
              <span>Implementar <strong>FeaturePipeline</strong> extensible</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">4</span>
              <span>Desarrollar modelos especializados (Sales, Demand, Anomaly)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">5</span>
              <span>Agregar métricas y monitoreo de performance</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MLArchitectureGuide;
