import type {
    CashFlow,
    Cliente,
    Compra,
    Empleado,
    FolioSequence,
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
import type Dexie from 'dexie';

// Utilidad para limpiar undefined y asegurar objeto plano
function toPlainObject<T>(data: Partial<T>): Partial<T> {
    return Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}

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

    async update(id: number, data: Partial<T>): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.table.update(id, toPlainObject(data) as any);
        }

    async delete(id: number): Promise<void> {
        await this.table.delete(id);
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
export const produccionStorage = new DexieStorage<ProduccionTicket>(db.produccionTickets);
export const compraStorage = new DexieStorage<Compra>(db.compras);
export const ventaStorage = new DexieStorage<Venta>(db.ventas);
export const cashFlowStorage = new DexieStorage<CashFlow>(db.cashFlow);
export const userRoleStorage = new DexieStorage<UserRole>(db.userRoles);
export const locationTypeStorage = new DexieStorage<LocationType>(db.locationTypes);
export const processTypeStorage = new DexieStorage<ProcessType>(db.processTypes);
export const syncQueueStorage = new DexieStorage<SyncQueue>(db.syncQueue);
export const folioSequenceStorage = new DexieStorage<FolioSequence>(db.folioSequences);

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
    clientes: clienteStorage, // Gestión de clientes: creación, edición, eliminación y consulta de registros de clientes.
    proveedores: proveedorStorage, // Gestión de proveedores: creación, edición, eliminación y consulta de registros de proveedores.
    productos: productoStorage, // Gestión de productos: creación, edición, eliminación y consulta de productos con flags de uso.
    empleados: empleadoStorage, // Gestión de empleados: creación, edición, eliminación y consulta de empleados con roles asignados.
    ubicaciones: ubicacionStorage, // Gestión de ubicaciones: creación, edición, eliminación y consulta de lugares físicos de almacenamiento.
    procesos: procesoStorage, // Gestión de procesos de producción: creación, edición, eliminación y consulta de procesos con insumos y salidas.
    inventario: inventarioStorage, // Gestión de inventario: registros de stock por producto y ubicación, con movimientos y actualizaciones.
    produccion: produccionStorage, // Gestión de tickets de producción: creación, edición, eliminación y consulta de registros de producción.
    compras: compraStorage, // Gestión de compras: registros de adquisiciones de productos con proveedores, precios y estados.
    ventas: ventaStorage, // Gestión de ventas: registros de ventas de productos a clientes, precios y estados de entrega.
    syncQueue, // Gestión de cola de sincronización: operaciones pendientes para sincronizar con la base de datos remota.
    userRoles: userRoleStorage, // Gestión de roles de usuario: tipos de roles disponibles para empleados y permisos asociados.
    locationTypes: locationTypeStorage, // Gestión de tipos de ubicación: categorías de lugares (patios, bodegas, etc.) con productos permitidos.
    processTypes: processTypeStorage, // Gestión de tipos de proceso: categorías de procesos de producción (destopado, pelado, etc.).
};
