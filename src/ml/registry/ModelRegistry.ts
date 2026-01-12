// 📁 src/ml/registry/ModelRegistry.ts
import {BaseMLModel} from '../models/base/BaseModel';
import {ModelMetadata, ModelType} from '../core/types';

export class ModelRegistry {
  private models = new Map<ModelType, BaseMLModel>();
  private metadata = new Map<ModelType, ModelMetadata>();

  registerModel(type: ModelType, model: BaseMLModel, metadata: ModelMetadata): void {
    this.models.set(type, model);
    this.metadata.set(type, metadata);
    console.log(`✅ Registered model: ${type} (${metadata.version})`);
  }

  getModel(type: ModelType): BaseMLModel | null {
    return this.models.get(type) || null;
  }

  getMetadata(type: ModelType): ModelMetadata | null {
    return this.metadata.get(type) || null;
  }

  getAllModels(): ModelType[] {
    return Array.from(this.models.keys());
  }

  isModelAvailable(type: ModelType): boolean {
    const model = this.models.get(type);
    return model !== undefined && model.isReady();
  }

  async initializeAllModels(): Promise<void> {
    const initPromises = Array.from(this.models.values()).map(model => model.initialize());
    await Promise.all(initPromises);
    console.log('✅ All models initialized');
  }

  async disposeAllModels(): Promise<void> {
    const disposePromises = Array.from(this.models.values()).map(model => model.dispose());
    await Promise.all(disposePromises);
    console.log('🗑️ All models disposed');
  }
}
