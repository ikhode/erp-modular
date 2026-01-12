// 📁 src/ml/models/sales/SalesPredictor.ts
import * as tf from '@tensorflow/tfjs';
import {BaseModel} from '../base/BaseModel';
import {ModelConfig, Prediction, TimeSeriesData} from '../../core/types';
import {StorageAdapter} from '../../infrastructure/StorageAdapter';

export interface SalesPredictionInput {
  date: Date;
  historicalSales: number[];
  season: number;
  promotions: boolean;
  economicIndicators: number[];
}

export class SalesPredictor extends BaseModel {
  constructor(storageAdapter: StorageAdapter) {
    const config: ModelConfig = {
      inputShape: [10], // 10 features
      outputShape: [1], // 1 prediction
      learningRate: 0.001,
      epochs: 100,
      batchSize: 32
    };
    super('SalesPredictor', config, storageAdapter);
  }

  async preprocessData(data: unknown[]): Promise<TimeSeriesData[]> {
    // Convertir datos crudos a TimeSeriesData
    return data.map((item: unknown) => {
      const typedItem = item as Record<string, unknown>;
      return {
        date: new Date(typedItem.date as string),
        value: (typedItem.sales as number) || 0,
        features: {
          season: typedItem.season,
          promotions: typedItem.promotions,
          economicIndicators: typedItem.economicIndicators
        }
      };
    });
  }

  createModel(): tf.LayersModel {
    return this.createSequentialModel([
      tf.layers.dense({ inputShape: this.config.inputShape, units: 64, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: this.config.outputShape[0] })
    ]);
  }

  async predict(input: unknown): Promise<Prediction> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const inputData = input as SalesPredictionInput;
    const features = this.extractFeatures(inputData);

    const tensor = tf.tensor2d([features], [1, features.length]);
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const result = await prediction.data();

    const predictedValue = result[0];
    const confidence = this.calculateConfidence(features);

    // Calcular trend basado en datos históricos
    const recentSales = inputData.historicalSales.slice(-2);
    const trend = recentSales.length >= 2
      ? this.calculateTrend(predictedValue, recentSales[recentSales.length - 1])
      : 'stable';

    const insights = this.generateInsights(predictedValue, confidence);

    return {
      value: predictedValue,
      confidence,
      trend,
      insights,
      timestamp: new Date()
    };
  }

  private extractFeatures(input: SalesPredictionInput): number[] {
    const features = [
      ...this.normalizeData(input.historicalSales.slice(-7)), // Últimas 7 ventas
      input.season / 12, // Normalizar temporada
      input.promotions ? 1 : 0, // Promociones
      ...this.normalizeData(input.economicIndicators) // Indicadores económicos
    ];

    // Asegurar que tenga exactamente 10 features
    while (features.length < 10) {
      features.push(0);
    }

    return features.slice(0, 10);
  }

  private calculateConfidence(features: number[]): number {
    // Confianza basada en varianza de features
    const variance = features.reduce((sum, val) => sum + Math.pow(val - features.reduce((a, b) => a + b, 0) / features.length, 2), 0) / features.length;
    return Math.max(0.1, Math.min(1, 1 - variance));
  }
}
