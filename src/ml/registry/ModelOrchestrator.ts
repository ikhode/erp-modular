// 📁 src/ml/registry/ModelOrchestrator.ts
import {BaseMLModel} from '../models/base/BaseModel';
import {FeaturePipeline} from '../features/FeaturePipeline';
import {Prediction} from '../core/types';

export class ModelOrchestrator {
  private featurePipeline: FeaturePipeline;

  constructor(featurePipeline: FeaturePipeline) {
    this.featurePipeline = featurePipeline;
  }

  async predict(model: BaseMLModel, input: Record<string, unknown>): Promise<Prediction> {
    const startTime = Date.now();

    try {
      // Procesar features
      const features = await this.featurePipeline.process(input);

      // Hacer predicción
      const prediction = await model.predict(features);

      // Agregar tiempo de procesamiento
      prediction.timestamp = new Date();
      prediction.processingTime = Date.now() - startTime;

      return prediction;
    } catch (error) {
      console.error('Error in model orchestration:', error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  async retrain(model: BaseMLModel, data: unknown[]): Promise<void> {
    try {
      await model.retrain(data);
      console.log(`✅ Model ${model.getName()} retrained successfully`);
    } catch (error) {
      console.error(`❌ Retraining failed for ${model.getName()}:`, error);
      throw error;
    }
  }

  async batchPredict(model: BaseMLModel, inputs: Record<string, unknown>[]): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    for (const input of inputs) {
      try {
        const prediction = await this.predict(model, input);
        predictions.push(prediction);
      } catch (error) {
        console.error('Batch prediction error:', error);
        // Continue with next input
      }
    }

    return predictions;
  }
}
