// 📁 src/ml/core/MLService.ts
import {ModelRegistry} from '../registry/ModelRegistry';
import {ModelOrchestrator} from '../registry/ModelOrchestrator';
import {StorageAdapter} from '../infrastructure/StorageAdapter';
import {MLRequest, MLResponse, ModelType} from './types';
import {PROCESSING_TIMEOUTS} from './constants';

export class MLService {
  private registry: ModelRegistry;
  private orchestrator: ModelOrchestrator;
  private storageAdapter: StorageAdapter;

  constructor(
    registry: ModelRegistry,
    orchestrator: ModelOrchestrator,
    storageAdapter: StorageAdapter
  ) {
    this.registry = registry;
    this.orchestrator = orchestrator;
    this.storageAdapter = storageAdapter;
  }

  async predict(request: MLRequest): Promise<MLResponse> {
    const startTime = Date.now();

    try {
      // Validar request
      this.validateRequest(request);

      // Obtener modelo
      const model = this.registry.getModel(request.modelType);
      if (!model) {
        throw new Error(`Model ${request.modelType} not found`);
      }

      // Verificar que el modelo esté listo
      if (!this.registry.isModelAvailable(request.modelType)) {
        throw new Error(`Model ${request.modelType} is not available`);
      }

      // Hacer predicción con timeout
      const prediction = await this.withTimeout(
        this.orchestrator.predict(model, request.input),
        PROCESSING_TIMEOUTS.PREDICTION
      );

      // Obtener metadata del modelo
      const metadata = this.registry.getMetadata(request.modelType);

      const response: MLResponse = {
        prediction,
        modelInfo: {
          name: metadata?.name || request.modelType,
          version: metadata?.version || '1.0.0',
          confidence: prediction.confidence
        },
        processingTime: Date.now() - startTime
      };

      return response;

    } catch (error) {
      console.error('ML Service prediction error:', error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  async retrain(modelType: ModelType, data: unknown[]): Promise<void> {
    try {
      const model = this.registry.getModel(modelType);
      if (!model) {
        throw new Error(`Model ${modelType} not found`);
      }

      await this.withTimeout(
        this.orchestrator.retrain(model, data),
        PROCESSING_TIMEOUTS.RETRAINING
      );

      console.log(`✅ Model ${modelType} retrained successfully`);

    } catch (error) {
      console.error(`❌ Retraining failed for ${modelType}:`, error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing ML Service...');
      await this.registry.initializeAllModels();
      console.log('✅ ML Service initialized');
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.registry.disposeAllModels();
      console.log('🗑️ ML Service disposed');
    } catch (error) {
      console.error('Error disposing ML Service:', error);
    }
  }

  getModelStatus(modelType: ModelType) {
    return this.registry.getMetadata(modelType);
  }

  getAvailableModels(): ModelType[] {
    return this.registry.getAllModels();
  }

  private validateRequest(request: MLRequest): void {
    if (!request.modelType) {
      throw new Error('modelType is required');
    }
    if (!request.input || typeof request.input !== 'object') {
      throw new Error('input must be a valid object');
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }
}
