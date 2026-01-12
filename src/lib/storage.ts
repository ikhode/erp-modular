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
    Terminal,
    TerminalSession,
    Transfer,
    Ubicacion,
    UserRole,
    Venta,
} from './db';
import {db} from './db';
import Dexie, {UpdateSpec} from 'dexie';

// Multi-tenancy context - now using a function to get tenant from context
let getCurrentTenantId: () => string | null = () => null;

export const setTenantGetter = (getter: () => string | null) => {
    getCurrentTenantId = getter;
};

export const getCurrentTenant = (): string => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
        throw new Error('No tenant context set. Call setCurrentTenant() first.');
    }
    return tenantId;
};

// For backward compatibility
export const setCurrentTenant = (tenantId: string) => {
    getCurrentTenantId = () => tenantId;
};

// Generic storage interface
interface StorageService<T> {
    getAll(): Promise<T[]>;
    getById(id: number): Promise<T | undefined>;
    add(data: Omit<T, 'id'>): Promise<number>;
    update(id: number, data: UpdateSpec<T>): Promise<void>;
    delete(id: number): Promise<void>;
}

// Multi-tenancy support
// Enhanced storage service with tenant filtering
class TenantAwareStorage<T extends { tenantId: string; id?: number }> implements StorageService<T> {
    private table: Dexie.Table<T, number>;

    constructor(table: Dexie.Table<T, number>) {
        this.table = table;
    }

    async getAll(): Promise<T[]> {
        const tenantId = this.ensureTenant();
        return this.table.where('tenantId').equals(tenantId).toArray();
    }

    async getById(id: number): Promise<T | undefined> {
        const tenantId = this.ensureTenant();
        return this.table.where('[tenantId+id]').equals([tenantId, id]).first();
    }

    async add(data: Omit<T, 'id'>): Promise<number> {
        const tenantId = this.ensureTenant();
        return this.table.add({ ...data, tenantId } as T);
    }

    async addMany(items: Omit<T, 'id'>[]): Promise<void> {
        const tenantId = this.ensureTenant();
        const itemsWithTenant = items.map(item => ({ ...item, tenantId } as T));
        await this.table.bulkAdd(itemsWithTenant);
    }

    async update(id: number, data: UpdateSpec<T>): Promise<void> {
        const tenantId = this.ensureTenant();
        await this.table.where('[tenantId+id]').equals([tenantId, id]).modify(data as UpdateSpec<T>);
    }

    async delete(id: number): Promise<void> {
        const tenantId = this.ensureTenant();
        await this.table.where('[tenantId+id]').equals([tenantId, id]).delete();
    }

    async clearAll(): Promise<void> {
        const tenantId = this.ensureTenant();
        await this.table.where('tenantId').equals(tenantId).delete();
    }

    async countAll(): Promise<number> {
        const tenantId = this.ensureTenant();
        return this.table.where('tenantId').equals(tenantId).count();
    }

    // Método específico para ProduccionTicket
    async getAllByEmployeeId(employeeId: number): Promise<T[]> {
        const tenantId = this.ensureTenant();
        return this.table.where('[tenantId+employeeId]').equals([tenantId, employeeId]).toArray();
    }

    private ensureTenant(): string {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
            throw new Error('No tenant context set. Call setTenantGetter() first.');
        }
        return tenantId;
    }
}

// ✅ Specific services (typed automatically) - Multi-tenant aware
export const clienteStorage = new TenantAwareStorage<Cliente>(db.clientes);
export const proveedorStorage = new TenantAwareStorage<Proveedor>(db.proveedores);
export const productoStorage = new TenantAwareStorage<Producto>(db.productos);
export const empleadoStorage = new TenantAwareStorage<Empleado>(db.empleados);
export const ubicacionStorage = new TenantAwareStorage<Ubicacion>(db.ubicaciones);
export const procesoStorage = new TenantAwareStorage<Proceso>(db.procesos);
export const inventarioStorage = new TenantAwareStorage<Inventario>(db.inventario);
export const produccionTicketsStorage = new TenantAwareStorage<ProduccionTicket>(db.produccionTickets);
export const compraStorage = new TenantAwareStorage<Compra>(db.compras);
export const ventaStorage = new TenantAwareStorage<Venta>(db.ventas);
export const cashFlowStorage = new TenantAwareStorage<CashFlow>(db.cashFlow);
export const userRoleStorage = new TenantAwareStorage<UserRole>(db.userRoles);
export const locationTypeStorage = new TenantAwareStorage<LocationType>(db.locationTypes);
export const syncQueueStorage = new TenantAwareStorage<SyncQueue>(db.syncQueue);
export const folioSequenceStorage = new TenantAwareStorage<FolioSequence>(db.folioSequences);
export const transferStorage = new TenantAwareStorage<Transfer>(db.transfers);
export const attendanceStorage = new TenantAwareStorage<Attendance>(db.attendance);
export const terminalStorage = new TenantAwareStorage<Terminal>(db.terminals);
export const terminalSessionStorage = new TenantAwareStorage<TerminalSession>(db.terminalSessions);

// ✅ Sync queue management (tenant-aware)
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
        } as Omit<SyncQueue, 'id'>);
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
        const tenantId = getCurrentTenantId();
        if (!tenantId) return [];
        return db.syncQueue.where('[tenantId+synced]').equals([tenantId, 0]).toArray();
    },

    async markSynced(id: number): Promise<void> {
        await syncQueueStorage.update(id, { synced: true });
    },

    async markFailed(id: number): Promise<void> {
        await syncQueueStorage.update(id, { synced: false, lastError: 'Max retries exceeded' });
    },

    async updateRetryCount(id: number, retryCount: number): Promise<void> {
        await syncQueueStorage.update(id, { retryCount, updatedAt: new Date() });
    },
};

// ✅ Utility
export const isOnline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine;

// ✅ Folio generation utility
export const folioGenerator = {
    async generateFolio(prefix: string): Promise<string> {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
            throw new Error('No tenant context set');
        }

        const sequence = await db.folioSequences.where('[tenantId+prefix]').equals([tenantId, prefix]).first();
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
        const tenantId = getCurrentTenantId();
        if (!tenantId) return;

        const existing = await db.folioSequences.where('tenantId').equals(tenantId).toArray();
        const prefixes = ['PROD', 'COMP', 'VENT', 'TRAS', 'DEV'];

        for (const prefix of prefixes) {
            if (!existing.find(s => s.prefix === prefix)) {
                await db.folioSequences.add({
                    tenantId,
                    prefix,
                    description: `Folios para ${prefix === 'PROD' ? 'producción' : prefix === 'COMP' ? 'compras' : prefix === 'VENT' ? 'ventas' : prefix === 'TRAS' ? 'traslados' : 'devoluciones'}`,
                    currentNumber: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as FolioSequence);
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
    terminals: terminalStorage,
    terminalSessions: terminalSessionStorage,
};

// ✅ Terminal management utilities
export const terminalManager = {
    async registerTerminal(deviceInfo: {
        deviceId: string;
        deviceType: 'kiosk' | 'mobile' | 'desktop';
        userAgent?: string;
        ipAddress?: string;
        location?: string;
    }, allowedModules: string[] = []): Promise<Terminal> {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
            throw new Error('No tenant context set');
        }

        // Check if terminal already exists
        const existing = await db.terminals.where('[tenantId+deviceId]').equals([tenantId, deviceInfo.deviceId]).first();

        if (existing) {
            // Update last seen
            await db.terminals.update(existing.id!, {
                lastSeen: new Date(),
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                updatedAt: new Date()
            });
            return existing;
        }

        // Create new terminal
        const terminalId = await db.terminals.add({
            ...deviceInfo,
            tenantId,
            isActive: true,
            faceAuthEnabled: true,
            allowedModules,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Terminal);

        const terminal = await db.terminals.get(terminalId);
        if (!terminal) {
            throw new Error('Failed to create terminal');
        }

        return terminal;
    },

    async startSession(terminalId: number, employeeId: number): Promise<TerminalSession> {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
            throw new Error('No tenant context set');
        }

        // End any existing active sessions for this employee on this terminal
        const activeSessions = await db.terminalSessions
            .where('[tenantId+terminalId+employeeId+endedAt]')
            .equals([tenantId, terminalId, employeeId, undefined])
            .toArray();

        for (const session of activeSessions) {
            await db.terminalSessions.update(session.id!, {
                endedAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Create new session
        const sessionId = await db.terminalSessions.add({
            tenantId,
            terminalId,
            employeeId,
            startedAt: new Date(),
            faceAuthUsed: false,
            ipAddress: await this.getClientIP(),
            userAgent: navigator.userAgent,
            actionsPerformed: [],
            createdAt: new Date(),
            updatedAt: new Date()
        } as TerminalSession);

        const session = await db.terminalSessions.get(sessionId);
        if (!session) {
            throw new Error('Failed to create session');
        }

        return session;
    },

    async endSession(sessionId: number): Promise<void> {
        await db.terminalSessions.update(sessionId, {
            endedAt: new Date(),
            updatedAt: new Date()
        });
    },

    async logAction(sessionId: number, action: string): Promise<void> {
        const session = await db.terminalSessions.get(sessionId);
        if (session) {
            const actions = session.actionsPerformed || [];
            actions.push(`${new Date().toISOString()}: ${action}`);
            await db.terminalSessions.update(sessionId, {
                actionsPerformed: actions,
                updatedAt: new Date()
            });
        }
    },

    async getClientIP(): Promise<string> {
        try {
            // This is a simplified approach - in production you'd use a service
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    async revokeTerminal(terminalId: number, reason: string, revokedBy: number): Promise<void> {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
            throw new Error('No tenant context set');
        }

        await db.terminals.where('[tenantId+id]').equals([tenantId, terminalId]).modify({
            isActive: false,
            revokedAt: new Date(),
            revokedBy,
            revocationReason: reason,
            updatedAt: new Date()
        });

        // End all active sessions for this terminal
        const activeSessions = await db.terminalSessions
            .where('[tenantId+terminalId+endedAt]')
            .equals([tenantId, terminalId, undefined])
            .toArray();

        for (const session of activeSessions) {
            await db.terminalSessions.update(session.id!, {
                endedAt: new Date(),
                updatedAt: new Date()
            });
        }
    }
};
