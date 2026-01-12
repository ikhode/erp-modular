// 📁 src/ml/infrastructure/StorageAdapter.ts
import {ModelState} from '../core/types';

export class StorageAdapter {
  private modelStates = new Map<string, ModelState>();

  async saveModel(name: string, state: ModelState): Promise<void> {
    this.modelStates.set(name, state);
    // Emitir evento si es necesario para React
    console.log(`💾 Model ${name} saved to memory`);
  }

  async loadModel(name: string): Promise<ModelState | null> {
    const state = this.modelStates.get(name);
    if (state) {
      console.log(`📖 Model ${name} loaded from memory`);
    }
    return state || null;
  }

  async deleteModel(name: string): Promise<void> {
    this.modelStates.delete(name);
    console.log(`🗑️ Model ${name} deleted from memory`);
  }

  getAllModels(): string[] {
    return Array.from(this.modelStates.keys());
  }

  clearAll(): void {
    this.modelStates.clear();
    console.log('🧹 All models cleared from memory');
  }

  getStats(): { totalModels: number; memoryUsage: number } {
    return {
      totalModels: this.modelStates.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    // Estimación básica del uso de memoria
    let totalSize = 0;
    for (const [name, state] of this.modelStates) {
      // Estimar tamaño basado en pesos y topología
      if (state.weights) {
        totalSize += state.weights.reduce((sum, w) => sum + w.length * 4, 0); // 4 bytes por float32
      }
      totalSize += JSON.stringify(state.modelTopology).length;
      totalSize += name.length;
    }
    return totalSize;
  }
}
