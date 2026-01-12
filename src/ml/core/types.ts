// 📁 src/ml/core/types.ts
export interface Prediction {
  value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
  timestamp: Date;
}

export interface FeatureVector {
  features: number[];
  metadata: Record<string, unknown>;
}

export interface ModelState {
  modelTopology: unknown;
  weightsManifest: unknown;
  trainingConfig: unknown;
  weights: Float32Array[];
  lastTraining: Date;
}

export interface ModelMetadata {
  name: string;
  version: string;
  type: ModelType;
  config: ModelConfig;
  performance: ModelPerformance;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastEvaluated: Date;
}

export interface ModelConfig {
  inputShape: number[];
  outputShape: number[];
  learningRate: number;
  epochs: number;
  batchSize: number;
}

export type ModelType = 'sales' | 'demand' | 'anomaly' | 'inventory' | 'production' | 'employee';

export interface MLRequest {
  modelType: ModelType;
  input: Record<string, unknown>;
  options?: {
    confidenceThreshold?: number;
    includeInsights?: boolean;
  };
}

export interface MLResponse {
  prediction: Prediction;
  modelInfo: {
    name: string;
    version: string;
    confidence: number;
  };
  processingTime: number;
}
