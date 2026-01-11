import type {
    Attendance,
    CashFlow,
    Cliente,
    Compra,
    Empleado,
    FolioSequence,
    Inventario,
    LocationType,
    Proceso,
    ProduccionTicket,
    Producto,
    Proveedor,
    SyncQueue,
    Transfer,
    Ubicacion,
    UserRole,
    Venta,
} from './db';
import {db} from './db';
import Dexie, type {UpdateSpec} from 'dexie';

// Generic storage interface
interface StorageService<T> {
    getAll(): Promise<T[]>;
    getById(id: number): Promise<T | undefined>;
    add(data: Omit<T, 'id'>): Promise<number>;
    update(id: number, data: Partial<T>): Promise<void>;
    delete(id: number): Promise<void>;
}

// ✅ Generic Dexie implementation with strong typing
class DexieStorage<T extends { id?: number }> implements StorageService<T> {
    private table: Dexie.Table<T, number>;

    constructor(table: Dexie.Table<T, number>) {
        this.table = table;
    }

    async getAll(): Promise<T[]> {
        return this.table.toArray();
    }

    async getById(id: number): Promise<T | undefined> {
        return this.table.get(id);
    }

    async add(data: Omit<T, 'id'>): Promise<number> {
        return this.table.add(data as T);
    }

    async addMany(items: Omit<T, 'id'>[]): Promise<void> {
        await this.table.bulkAdd(items as T[]);
    }

    async update(id: number, data: Partial<T>): Promise<void> {
        await this.table.update(id, data as UpdateSpec<T>);
    }

    async delete(id: number): Promise<void> {
        await this.table.delete(id);
    }

    async clearAll(): Promise<void> {
        await this.table.clear();
    }

    async countAll(): Promise<number> {
        return this.table.count();
    }

    // Método específico para ProduccionTicket
    async getAllByEmployeeId(employeeId: number): Promise<T[]> {
        return this.table.where('employeeId').equals(employeeId).toArray();
    }

    async where(condition: string): Promise<T[]> {
        return this.table.where(condition).toArray();
    }
}

// ✅ Specific services (typed automatically)
export const clienteStorage = new DexieStorage<Cliente>(db.clientes);
export const proveedorStorage = new DexieStorage<Proveedor>(db.proveedores);
export const productoStorage = new DexieStorage<Producto>(db.productos);
export const empleadoStorage = new DexieStorage<Empleado>(db.empleados);
export const ubicacionStorage = new DexieStorage<Ubicacion>(db.ubicaciones);
export const procesoStorage = new DexieStorage<Proceso>(db.procesos);
export const inventarioStorage = new DexieStorage<Inventario>(db.inventario);
export const produccionTicketsStorage = new DexieStorage<ProduccionTicket>(db.produccionTickets);
export const compraStorage = new DexieStorage<Compra>(db.compras);
export const ventaStorage = new DexieStorage<Venta>(db.ventas);
export const cashFlowStorage = new DexieStorage<CashFlow>(db.cashFlow);
export const userRoleStorage = new DexieStorage<UserRole>(db.userRoles);
export const locationTypeStorage = new DexieStorage<LocationType>(db.locationTypes);
export const syncQueueStorage = new DexieStorage<SyncQueue>(db.syncQueue);
export const folioSequenceStorage = new DexieStorage<FolioSequence>(db.folioSequences);
export const transferStorage = new DexieStorage<Transfer>(db.transfers);
export const attendanceStorage = new DexieStorage<Attendance>(db.attendance);

// ✅ Sync queue management
export const syncQueue = {
    async add(
        operation: SyncQueue['operation'],
        table: string,
        data: Record<string, unknown>
    ): Promise<void> {
        await syncQueueStorage.add({
            operation,
            table,
            data,
            createdAt: new Date(),
            synced: false,
        } as SyncQueue);
    },
    async addMany(items: Omit<SyncQueue, 'id'>[]): Promise<void> {
        await syncQueueStorage.addMany(items);
    },
    async clearAll(): Promise<void> {
        await syncQueueStorage.clearAll();
    },
    async countAll(): Promise<number> {
        return syncQueueStorage.countAll();
    },
    async getPending(): Promise<SyncQueue[]> {
        // Use 0 instead of false for boolean index in Dexie
        return db.syncQueue.where('synced').equals(0).toArray();
    },

    async markSynced(id: number): Promise<void> {
        await syncQueueStorage.update(id, { synced: true });
    },
};

// ✅ Utility
export const isOnline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine;

// ✅ Folio generation utility
export const folioGenerator = {
    async generateFolio(prefix: string): Promise<string> {
        const sequence = await db.folioSequences.where('prefix').equals(prefix).first();
        if (!sequence) {
            throw new Error(`Prefijo de folio no encontrado: ${prefix}`);
        }

        const nextNumber = sequence.currentNumber + 1;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const folio = `${dateStr}-${nextNumber.toString().padStart(5, '0')}`;

        await db.folioSequences.update(sequence.id!, { currentNumber: nextNumber, updatedAt: new Date() });

        return folio;
    },

    async initializeSequences(): Promise<void> {
        const existing = await db.folioSequences.toArray();
        const prefixes = ['PROD', 'COMP', 'VENT', 'TRAS', 'DEV'];

        for (const prefix of prefixes) {
            if (!existing.find(s => s.prefix === prefix)) {
                await db.folioSequences.add({
                    prefix,
                    description: `Folios para ${prefix === 'PROD' ? 'producción' : prefix === 'COMP' ? 'compras' : prefix === 'VENT' ? 'ventas' : prefix === 'TRAS' ? 'traslados' : 'devoluciones'}`,
                    currentNumber: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    },
};

// ✅ Unified export for modular access
export const storage = {
    clientes: clienteStorage,
    proveedores: proveedorStorage,
    productos: productoStorage,
    empleados: empleadoStorage,
    ubicaciones: ubicacionStorage,
    procesos: procesoStorage,
    inventario: inventarioStorage,
    produccionTickets: produccionTicketsStorage,
    compras: compraStorage,
    ventas: ventaStorage,
    syncQueue: syncQueueStorage,
    userRoles: userRoleStorage,
    locationTypes: locationTypeStorage,
    transfers: transferStorage,
    attendance: attendanceStorage,
    cashFlow: cashFlowStorage,
    folioSequences: folioSequenceStorage,
};
