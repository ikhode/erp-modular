export interface ContinuousLearningConfig {
  enabled: boolean;
  updateInterval: number; // minutos
  minDataPoints: number;
  maxTrainingTime: number; // segundos
  learningRate: number;
}

export const defaultMLConfig: ContinuousLearningConfig = {
  enabled: true,
  updateInterval: 60, // 60 minutos
  minDataPoints: 10,
  maxTrainingTime: 300, // 5 minutos
  learningRate: 0.001
};
