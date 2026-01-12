import * as tf from '@tensorflow/tfjs';
import {StorageAdapter} from '../../infrastructure/StorageAdapter';
import {ModelConfig, Prediction, TimeSeriesData} from '../../core/types';

export abstract class BaseMLModel {
  protected model: tf.LayersModel | null = null;
  protected isTrained: boolean = false;
  protected lastTraining: Date | null = null;
  protected config: ModelConfig;
  protected modelName: string;
  protected storageAdapter: StorageAdapter;

  constructor(modelName: string, config: ModelConfig, storageAdapter: StorageAdapter) {
    this.modelName = modelName;
    this.config = config;
    this.storageAdapter = storageAdapter;
  }

  abstract preprocessData(data: unknown[]): Promise<TimeSeriesData[]>;
  abstract createModel(): unknown;
  abstract predict(input: unknown): Promise<Prediction>;

  async initialize(): Promise<void> {
    try {
      // Try to load existing model
      await this.loadModel();

      // If no model exists, create new one
      if (!this.model) {
        this.model = this.createModel() as tf.LayersModel;
        await this.model.compile({
          optimizer: tf.train.adam(this.config.learningRate),
          loss: 'meanSquaredError',
          metrics: ['mse']
        });
      }
    } catch (error) {
      console.error(`Error initializing model ${this.modelName}:`, error);
    }
  }

  async retrain(data: unknown[]): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      const processedData = await this.preprocessData(data);
      // Implement retraining logic here
      console.log(`Retraining ${this.modelName} with ${processedData.length} samples`);
      this.lastTraining = new Date();
      await this.saveModel();
    } catch (error) {
      console.error(`Error retraining model ${this.modelName}:`, error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.model !== null && this.isTrained;
  }

  getStatus() {
    return {
      name: this.modelName,
      isTrained: this.isTrained,
      lastTraining: this.lastTraining,
      config: this.config
    };
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isTrained = false;
  }

  async loadModel(): Promise<void> {
    try {
      const modelState = await this.storageAdapter.loadModel(this.modelName);
      if (modelState) {
        this.model = await tf.models.modelFromJSON(modelState.modelTopology as unknown);
        this.model.setWeights(modelState.weights);
        this.isTrained = true;
        this.lastTraining = modelState.lastTraining;
      }
    } catch (error) {
      console.error(`Error loading model ${this.modelName}:`, error);
    }
  }

  async saveModel(): Promise<void> {
    if (!this.model) return;

    try {
      const modelArtifacts = await this.model.save(tf.io.withSaveHandler(async (artifacts) => artifacts));
      const weights = this.model.getWeights().map(w => w.dataSync());

      const modelState = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest: modelArtifacts.weightsManifest,
        trainingConfig: modelArtifacts.trainingConfig,
        weights,
        lastTraining: new Date()
      };

      await this.storageAdapter.saveModel(this.modelName, modelState);
      this.lastTraining = new Date();
    } catch (error) {
      console.error(`Error saving model ${this.modelName}:`, error);
    }
  }
}
