// 📁 src/ml/core/MLServiceFactory.ts
import {MLService} from './MLService';
import {ModelRegistry} from '../registry/ModelRegistry';
import {ModelOrchestrator} from '../registry/ModelOrchestrator';
import {FeatureExtractor, FeaturePipeline, FeatureTransformer} from '../features/FeaturePipeline';
import {StorageAdapter} from '../infrastructure/StorageAdapter';
import {SalesPredictor} from '../models/sales/SalesPredictor';
import {ModelMetadata} from './types';
import {DEFAULT_MODEL_CONFIGS} from './constants';

export class MLServiceFactory {
  static create(): MLService {
    // Crear infraestructura
    const storageAdapter = new StorageAdapter();

    // Crear registry
    const registry = new ModelRegistry();

    // Crear extractores y transformadores de features (simplificados)
    const extractors: FeatureExtractor[] = [];
    const transformers: FeatureTransformer[] = [];

    // Crear pipeline de features
    const featurePipeline = new FeaturePipeline(extractors, transformers);

    // Crear orchestrator
    const orchestrator = new ModelOrchestrator(featurePipeline);

    // Registrar modelos
    this.registerModels(registry, storageAdapter);

    // Crear servicio principal
    return new MLService(registry, orchestrator, storageAdapter);
  }

  private static registerModels(registry: ModelRegistry, storageAdapter: StorageAdapter): void {
    // Sales Predictor
    const salesPredictor = new SalesPredictor(storageAdapter);
    const salesMetadata: ModelMetadata = {
      name: 'Sales Predictor',
      version: '1.0.0',
      type: 'sales',
      config: DEFAULT_MODEL_CONFIGS.sales,
      performance: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        lastEvaluated: new Date()
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    registry.registerModel('sales', salesPredictor, salesMetadata);

    // Aquí se registrarían otros modelos cuando estén implementados
    // registry.registerModel('demand', new DemandForecaster(storageAdapter), demandMetadata);
    // registry.registerModel('anomaly', new AnomalyDetector(storageAdapter), anomalyMetadata);
  }
}
