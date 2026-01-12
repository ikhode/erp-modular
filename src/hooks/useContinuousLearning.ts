import {useEffect, useRef} from 'react';
import {ContinuousLearningConfig} from '../lib/mlConfig';

export const useContinuousLearning = (
  config: ContinuousLearningConfig,
  retrainCallback: () => Promise<void>
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    console.log('⏰ Aprendizaje continuo configurado cada', config.updateInterval, 'minutos');

    intervalRef.current = setInterval(async () => {
      await retrainCallback();
    }, config.updateInterval * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🛑 Aprendizaje continuo detenido');
      }
    };
  }, [config.enabled, config.updateInterval, retrainCallback]);

  const stopContinuousLearning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🛑 Aprendizaje continuo detenido');
    }
  };

  return { stopContinuousLearning };
};
