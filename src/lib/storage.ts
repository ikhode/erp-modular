import type {
    Cliente,
    Compra,
    Empleado,
    Inventario,
    LocationType,
    Proceso,
    ProcessType,
    ProduccionTicket,
    Producto,
    Proveedor,
    SyncQueue,
    Ubicacion,
    UserRole,
    Venta,
} from './db';
import {db} from './db';

// Generic storage interface
interface StorageService<T> {
  getAll(): Promise<T[]>;
  getById(id: number): Promise<T | undefined>;
  add(data: Omit<T, 'id'>): Promise<number>;
  update(id: number, data: Partial<T>): Promise<void>;
  delete(id: number): Promise<void>;
}

// Generic implementation using Dexie
class DexieStorage<T extends { id?: number }> implements StorageService<T> {
  constructor(private table: unknown) {}

  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async getById(id: number): Promise<T | undefined> {
    return this.table.get(id);
  }

  async add(data: Omit<T, 'id'>): Promise<number> {
    return this.table.add(data);
  }

  async update(id: number, data: Partial<T>): Promise<void> {
    await this.table.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.table.delete(id);
  }
}

// Specific services
export const clienteStorage = new DexieStorage<Cliente>(db.clientes);
export const proveedorStorage = new DexieStorage<Proveedor>(db.proveedores);
export const productoStorage = new DexieStorage<Producto>(db.productos);
export const empleadoStorage = new DexieStorage<Empleado>(db.empleados);
export const ubicacionStorage = new DexieStorage<Ubicacion>(db.ubicaciones);
export const procesoStorage = new DexieStorage<Proceso>(db.procesos);
export const inventarioStorage = new DexieStorage<Inventario>(db.inventario);
export const produccionStorage = new DexieStorage<ProduccionTicket>(db.produccionTickets);
export const compraStorage = new DexieStorage<Compra>(db.compras);
export const ventaStorage = new DexieStorage<Venta>(db.ventas);
export const syncQueueStorage = new DexieStorage<SyncQueue>(db.syncQueue);
export const userRoleStorage = new DexieStorage<UserRole>(db.userRoles);
export const locationTypeStorage = new DexieStorage<LocationType>(db.locationTypes);
export const processTypeStorage = new DexieStorage<ProcessType>(db.processTypes);

// Sync queue management
export const syncQueue = {
  async add(operation: SyncQueue['operation'], table: string, data: Record<string, unknown>): Promise<void> {
    await syncQueueStorage.add({
      operation,
      table,
      data,
      createdAt: new Date(),
      synced: false,
    });
  },

  async getPending(): Promise<SyncQueue[]> {
    return db.syncQueue.where('synced').equals(false).toArray();
  },

  async markSynced(id: number): Promise<void> {
    await syncQueueStorage.update(id, { synced: true });
  },
};

// Utility to check if online
export const isOnline = (): boolean => navigator.onLine;

// Export all storages
export const storage = {
  clientes: clienteStorage,
  proveedores: proveedorStorage,
  productos: productoStorage,
  empleados: empleadoStorage,
  ubicaciones: ubicacionStorage,
  procesos: procesoStorage,
  inventario: inventarioStorage,
  produccion: produccionStorage,
  compras: compraStorage,
  ventas: ventaStorage,
  syncQueue,
  userRoles: userRoleStorage,
  locationTypes: locationTypeStorage,
  processTypes: processTypeStorage,
};
