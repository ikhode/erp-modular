// 📁 src/ml/core/constants.ts
export const MODEL_TYPES = {
  SALES: 'sales',
  DEMAND: 'demand',
  ANOMALY: 'anomaly',
  INVENTORY: 'inventory',
  PRODUCTION: 'production',
  EMPLOYEE: 'employee'
} as const;

export const DEFAULT_MODEL_CONFIGS = {
  [MODEL_TYPES.SALES]: {
    inputShape: [10],
    outputShape: [1],
    learningRate: 0.001,
    epochs: 100,
    batchSize: 32
  },
  [MODEL_TYPES.DEMAND]: {
    inputShape: [7],
    outputShape: [1],
    learningRate: 0.001,
    epochs: 100,
    batchSize: 32
  },
  [MODEL_TYPES.ANOMALY]: {
    inputShape: [20],
    outputShape: [1],
    learningRate: 0.001,
    epochs: 50,
    batchSize: 16
  }
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4
} as const;

export const PROCESSING_TIMEOUTS = {
  PREDICTION: 5000, // 5 seconds
  TRAINING: 300000, // 5 minutes
  RETRAINING: 60000 // 1 minute
} as const;
