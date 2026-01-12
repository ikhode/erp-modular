// 📁 src/ml/features/FeaturePipeline.ts
import {FeatureVector} from '../core/types';

export abstract class FeatureExtractor {
  abstract extract(input: Record<string, unknown>): Promise<Partial<FeatureVector>>;
}

export abstract class FeatureTransformer {
  abstract transform(features: FeatureVector): Promise<FeatureVector>;
}

export class FeaturePipeline {
  private extractors: FeatureExtractor[];
  private transformers: FeatureTransformer[];

  constructor(extractors: FeatureExtractor[], transformers: FeatureTransformer[]) {
    this.extractors = extractors;
    this.transformers = transformers;
  }

  async process(rawData: Record<string, unknown>): Promise<FeatureVector> {
    try {
      // Extracción de features
      let features: FeatureVector = {
        features: [],
        metadata: {}
      };

      for (const extractor of this.extractors) {
        const extracted = await extractor.extract(rawData);
        features = this.mergeFeatures(features, extracted);
      }

      // Transformación de features
      for (const transformer of this.transformers) {
        features = await transformer.transform(features);
      }

      // Validación final
      await this.validateFeatures(features);

      return features;

    } catch (error) {
      console.error('Feature pipeline error:', error);
      throw new Error(`Feature processing failed: ${error.message}`);
    }
  }

  private mergeFeatures(base: FeatureVector, additional: Partial<FeatureVector>): FeatureVector {
    return {
      features: [...base.features, ...(additional.features || [])],
      metadata: { ...base.metadata, ...(additional.metadata || {}) }
    };
  }

  private async validateFeatures(features: FeatureVector): Promise<void> {
    if (!features.features || features.features.length === 0) {
      throw new Error('No features extracted');
    }

    // Validar que no haya NaN o Infinity
    for (const feature of features.features) {
      if (!isFinite(feature)) {
        throw new Error('Invalid feature value detected');
      }
    }
  }
}
