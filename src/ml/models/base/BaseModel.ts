// 📁 src/ml/models/base/BaseModel.ts
import * as tf from '@tensorflow/tfjs';
import {BaseMLModel, StorageAdapter} from '../../infrastructure/StorageAdapter';
import {ModelConfig, Prediction, TimeSeriesData} from '../../core/types';

export abstract class BaseModel extends BaseMLModel {
  constructor(modelName: string, config: ModelConfig, storageAdapter: StorageAdapter) {
    super(modelName, config, storageAdapter);
  }

  abstract preprocessData(data: unknown[]): Promise<TimeSeriesData[]>;
  abstract createModel(): tf.LayersModel;
  abstract predict(input: unknown): Promise<Prediction>;

  protected createSequentialModel(layers: tf.layers.Layer[]): tf.LayersModel {
    const model = tf.sequential({ layers });
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });
    return model;
  }

  protected normalizeData(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / data.length);
    return data.map(x => (x - mean) / (std || 1));
  }

  protected createTimeSeriesFeatures(data: TimeSeriesData[], windowSize: number): number[][] {
    const features: number[][] = [];
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i).map(d => d.value);
      features.push(window);
    }
    return features;
  }

  protected calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  protected generateInsights(prediction: number, confidence: number): string[] {
    const insights: string[] = [];

    if (confidence > 0.8) {
      insights.push('Alta confianza en la predicción');
    } else if (confidence < 0.5) {
      insights.push('Baja confianza - considerar más datos');
    }

    if (prediction > 0) {
      insights.push('Tendencia positiva esperada');
    } else {
      insights.push('Tendencia negativa esperada');
    }

    return insights;
  }
}
