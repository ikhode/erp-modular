/**
 * Utilidad segura para localStorage con manejo de errores
 * Mitiga problemas en desarrollo con HMR y entornos restringidos
 */

const STORAGE_PREFIX = 'erp_modular_';

class SafeStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable) {
      console.warn('localStorage not available, using default value');
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable) {
      console.warn('localStorage not available, cannot save');
      return false;
    }

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key ${key}:`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key ${key}:`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      // Solo limpiar keys con nuestro prefijo
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }

  // Método para desarrollo: limpiar todo en cada carga
  clearAllInDev(): void {
    if (import.meta.env.DEV && this.isAvailable) {
      try {
        localStorage.clear();
        console.log('localStorage cleared in development mode');
      } catch (error) {
        console.warn('Error clearing localStorage in dev mode:', error);
      }
    }
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }
}

export const safeStorage = new SafeStorage();

// Limpiar en desarrollo para evitar conflictos con HMR
if (import.meta.env.DEV) {
  safeStorage.clearAllInDev();
}
