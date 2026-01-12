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
