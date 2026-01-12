import * as tf from '@tensorflow/tfjs';
import {MLServiceFactory} from '../ml/core/MLServiceFactory';
import {MLRequest, ModelType} from '../ml/core/types';
import {ContinuousLearningConfig, defaultMLConfig} from './mlConfig';
import {PredictionResult, TimeSeriesData} from './mlService/index';

// Configurar TensorFlow.js para usar WebGL cuando esté disponible
tf.setBackend('webgl').catch(() => {
  console.log('WebGL no disponible, usando CPU');
  tf.setBackend('cpu');
});

export interface MLStats {
  modelsLoaded: number;
  backend: string;
  memoryUsage: number;
  continuousLearning: boolean;
  lastUpdates: Record<string, Date>;
}

export interface AnomalyResult {
  anomalyScore: number;
  confidence: number;
  insights: string[];
  [key: string]: unknown;
}

class MLService {
  private mlService: import('../ml/core/MLService').MLService;
  private config: ContinuousLearningConfig = defaultMLConfig;

  constructor() {
    this.mlService = MLServiceFactory.create();
    this.initialize();
  }

  async predictSales(input?: Record<string, unknown>): Promise<PredictionResult> {
    const request: MLRequest = {
      modelType: 'sales',
      input: input || {}
    };
    const response = await this.mlService.predict(request);
    return response.prediction;
  }

  async predictProductionEfficiency(input?: Record<string, unknown>): Promise<PredictionResult> {
    const request: MLRequest = {
      modelType: 'production',
      input: input || {}
    };
    const response = await this.mlService.predict(request);
    return response.prediction;
  }

  async optimizeInventory(input?: Record<string, unknown>): Promise<PredictionResult> {
    const request: MLRequest = {
      modelType: 'inventory',
      input: input || {}
    };
    const response = await this.mlService.predict(request);
    return response.prediction;
  }

  async forecastDemand(productId?: number): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const request: MLRequest = {
        modelType: 'demand',
        input: { date, productId }
      };
      try {
        const response = await this.mlService.predict(request);
        predictions.push(response.prediction);
      } catch (error) {
        console.warn(`Demand forecast for day ${i} failed:`, error);
      }
    }
    return predictions;
  }

  async predictMaintenance(): Promise<PredictionResult> {
    // Placeholder - implementar cuando esté disponible
    throw new Error('Maintenance prediction not yet implemented');
  }

  async predictEmployeePerformance(): Promise<PredictionResult> {
    // Placeholder - implementar cuando esté disponible
    throw new Error('Employee performance prediction not yet implemented');
  }

  async detectAnomalies(): Promise<AnomalyResult[]> {
    // Placeholder - implementar cuando esté disponible
    throw new Error('Anomaly detection not yet implemented');
  }

  async retrainAllModels(): Promise<void> {
    // Implementar re-entrenamiento usando la nueva arquitectura
    console.log('🔄 Retraining all models...');
    // Aquí iría la lógica para re-entrenar modelos específicos
  }

  stopContinuousLearning(): void {
    // Implementar detención de aprendizaje continuo
    console.log('🛑 Continuous learning stopped');
  }

  getStats(): MLStats {
    // Obtener estadísticas del nuevo servicio
    const availableModels = this.mlService.getAvailableModels();
    return {
      modelsLoaded: availableModels.length,
      backend: 'WebGL', // Placeholder
      memoryUsage: 0, // Placeholder
      continuousLearning: this.config.enabled,
      lastUpdates: {} // Placeholder
    };
  }

  async dispose(): Promise<void> {
    await this.mlService.dispose();
  }

  isReady(): boolean {
    return true; // Placeholder
  }

  getModelStatus(modelName: string) {
    return this.mlService.getModelStatus(modelName as ModelType);
  }

  private async initialize(): Promise<void> {
    try {
      await this.mlService.initialize();
      console.log('✅ ML Service initialized with new architecture');
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error);
    }
  }
}

// Singleton instance
let mlServiceInstance: MLService | null = null;

export function getMLService(): MLService {
  if (!mlServiceInstance) {
    mlServiceInstance = new MLService();
  }
  return mlServiceInstance;
}

export { MLService };
export type { PredictionResult, TimeSeriesData };
