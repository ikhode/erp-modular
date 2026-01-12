import Dexie, {Table} from 'dexie';

// Interfaces para las tablas principales del ERP
export interface Cliente {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  rfc: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  // Datos bancarios
  banco?: string;
  cuentaBancaria?: string;
  clabe?: string;
  // Firma digital (solo primera vez)
  firmaBase64?: string;
  // Estado y control
  activo?: boolean;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proveedor {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  rfc: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  firmaBase64?: string;
  // Datos bancarios
  banco?: string;
  cuentaBancaria?: string;
  clabe?: string;
  // Estado y control
  activo?: boolean;
  tipoProveedor?: 'proveedor' | 'transportista' | 'servicio';
  categoria?: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Producto {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  descripcion?: string;
  categoria?: string; // Categoría del producto
  precioMin: number;
  precioMax: number;
  precioActual: number;
  precioCompra?: number; // Precio de compra promedio
  unidad: string;
  // Flags de uso para trazabilidad y flexibilidad
  compra: boolean; // Se puede comprar
  venta: boolean; // Se puede vender
  procesoEntrada: boolean; // Puede ser insumo de proceso
  procesoSalida: boolean; // Puede ser generado por proceso
  createdAt: Date;
  updatedAt: Date;
}

export interface Empleado {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  rol: string; // Reference to user_roles.name
  email?: string;
  telefono?: string;
  alias?: string; // Alias interno para identificación rápida
  faceImageBase64?: string; // Imagen facial en base64 para autenticación
  faceId?: string; // ID único de la cara para reconocimiento facial
  activo?: boolean; // Estado del empleado
  createdAt: Date;
  updatedAt: Date;
}

export interface Ubicacion {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  tipo: string; // Reference to location_types.name
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proceso {
  id?: number;
  tenantId: string; // Multi-tenancy support
  nombre: string;
  descripcion?: string;
  ubicacionId: number;
  requiereFaceAuth: boolean;
  tipo: string; // Reference to process_types.name
  createdAt: Date;
  updatedAt: Date;
  // Nuevos campos estructurados para indexación y legibilidad
  inputs: ProcessItem[];
  outputs: ProcessItem[];
  reglas?: unknown; // reglas de negocio, si aplica
}

export interface ProcessItem {
  modoProducto: 'tipo' | 'producto';
  tipoProducto?: string;
  productId?: string;
  productName?: string;
  unit?: string;
  modoUbicacion: 'tipo' | 'especifica';
  tipoUbicacion?: number;
  ubicacionId?: number;
}

export interface Inventario {
  id?: number;
  tenantId: string; // Multi-tenancy support
  productoId: number;
  ubicacionId: number;
  cantidad: number;
  minimo: number;
  maximo: number;
  proveedor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProduccionTicket {
  id?: number;
  tenantId: string; // Multi-tenancy support
  folio?: string; // Nuevo campo para folio automático
  processId: number;
  employeeId: number;
  tiempoEstimado?: number; // Tiempo estimado en minutos
  prioridad?: number; // Prioridad del ticket (1-5)
  insumos: { productId: number; ubicacionId: number; cantidad: number }[]; // Corregido para consistencia
  productosGenerados?: { productId: number; ubicacionId: number; cantidad: number }[]; // Productos generados
  productoTerminadoId: number;
  cantidadProducida: number;
  ubicacionDestinoId: number;
  firmaEmpleadoBase64?: string;
  faceAuthData?: Record<string, unknown>; // Datos biométricos
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  // Campos de pago mejorados
  paymentAmount?: number;
  paymentMethod?: 'efectivo' | 'transferencia' | 'cheque';
  paidBy?: number; // ID del supervisor que pagó
  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  paidAt?: Date;
  // Campos adicionales para trazabilidad
  notes?: string;
  supervisorNotes?: string;
  qualityCheck?: boolean;
  qualityNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Compra {
  id?: number;
  tenantId: string; // Multi-tenancy support
  folio?: string; // Nuevo campo para folio automático
  proveedorId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  totalAmount?: number; // Calculado automáticamente
  tipo: 'parcela' | 'planta';
  vehiculo?: string;
  conductor?: string;
  firmaConductorBase64?: string;
  firmaEncargadoBase64?: string;
  firmaProveedorBase64?: string;
  estado: 'salida' | 'carga' | 'regreso' | 'completado';
  // Timestamps por estado
  departureTime?: Date;
  loadingTime?: Date;
  returnTime?: Date;
  completionTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Venta {
  id?: number;
  tenantId: string; // Multi-tenancy support
  folio?: string; // Nuevo campo para folio automático
  clienteId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  totalAmount?: number; // Calculado automáticamente
  tipoEntrega: 'cliente_recoge' | 'flete_propio' | 'flete_externo';
  vehiculo?: string;
  conductor?: string;
  firmaClienteBase64?: string;
  firmaConductorBase64?: string;
  estado: 'pendiente' | 'en_preparacion' | 'en_transito' | 'entregado';
  // Timestamps por estado
  preparationTime?: Date;
  transitTime?: Date;
  deliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transfer {
  id?: number;
  tenantId: string; // Multi-tenancy support
  folio?: string; // Nuevo campo para folio automático
  productoId: number;
  cantidad: number;
  ubicacionOrigenId: number;
  ubicacionDestinoId: number;
  status: 'pendiente' | 'en_transito' | 'completado' | 'cancelado';
  solicitadoPor?: number; // ID del empleado que solicita
  aprobadoPor?: number; // ID del supervisor que aprueba
  transportadoPor?: number; // ID del empleado que transporta
  fechaSolicitud: Date;
  fechaAprobacion?: Date;
  fechaTransporte?: Date;
  fechaCompletado?: Date;
  motivoCancelacion?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id?: number;
  tenantId: string; // Multi-tenancy support
  employeeId: number;
  action: 'entrada' | 'salida' | 'comida' | 'regreso_comida' | 'baño' | 'regreso_baño';
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueue {
  id?: number;
  tenantId: string; // Multi-tenancy support
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  createdAt: Date;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
  updatedAt?: Date;
}

export interface CashFlow {
  id?: number;
  tenantId: string; // Multi-tenancy support
  amount: number;
  movementType: 'ingreso' | 'egreso';
  sourceType: 'venta' | 'compra' | 'produccion' | 'capital' | 'nomina' | 'gasto' | 'devolucion' | 'otro';
  referenceType?: string;
  referenceId?: number;
  description: string;
  paymentMethod?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro';
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para las tablas de configuración
export interface UserRole {
  id?: number;
  tenantId: string; // Multi-tenancy support
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationType {
  id?: number;
  tenantId: string; // Multi-tenancy support
  name: string;
  description?: string;
  productosPermitidos?: number[]; // IDs de productos permitidos
  createdAt: Date;
  updatedAt: Date;
}

export interface FolioSequence {
  id?: number;
  tenantId: string; // Multi-tenancy support
  prefix: string;
  description?: string;
  currentNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para terminales y dispositivos
export interface Terminal {
  id?: number;
  tenantId: string; // Multi-tenancy support
  name: string;
  deviceId: string; // Unique device identifier
  deviceType: 'kiosk' | 'mobile' | 'desktop';
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  lastSeen?: Date;
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: number;
  revocationReason?: string;
  faceAuthEnabled: boolean;
  allowedModules: string[]; // Array of allowed module names
  createdAt: Date;
  updatedAt: Date;
}

export interface TerminalSession {
  id?: number;
  tenantId: string; // Multi-tenancy support
  terminalId: number;
  employeeId: number;
  startedAt: Date;
  endedAt?: Date;
  faceAuthUsed: boolean;
  ipAddress?: string;
  userAgent?: string;
  actionsPerformed: string[]; // Array of actions performed during session
  createdAt: Date;
  updatedAt: Date;
}

// Base de datos Dexie
export class ERPDB extends Dexie {
  clientes!: Table<Cliente>;
  proveedores!: Table<Proveedor>;
  productos!: Table<Producto>;
  empleados!: Table<Empleado>;
  ubicaciones!: Table<Ubicacion>;
  procesos!: Table<Proceso>;
  inventario!: Table<Inventario>;
  produccionTickets!: Table<ProduccionTicket>;
  compras!: Table<Compra>;
  ventas!: Table<Venta>;
  transfers!: Table<Transfer>;
  attendance!: Table<Attendance>;
  cashFlow!: Table<CashFlow>;
  syncQueue!: Table<SyncQueue>;
  userRoles!: Table<UserRole>;
  locationTypes!: Table<LocationType>;
  folioSequences!: Table<FolioSequence>;
  terminals!: Table<Terminal>;
  terminalSessions!: Table<TerminalSession>;

  constructor() {
    super('erp_modular');
    this.version(9).stores({
      clientes: '++id, tenantId, nombre, rfc, email, createdAt',
      proveedores: '++id, tenantId, nombre, rfc, email, createdAt',
      productos: '++id, tenantId, nombre, precioActual, createdAt',
      empleados: '++id, tenantId, nombre, alias, rol, email, createdAt',
      ubicaciones: '++id, tenantId, nombre, tipo, createdAt',
      procesos: '++id, tenantId, nombre, ubicacionId, requiereFaceAuth, createdAt',
      inventario: '++id, tenantId, productoId, ubicacionId, cantidad, minimo, maximo, proveedor, createdAt',
      produccionTickets: '++id, tenantId, folio, processId, employeeId, productoTerminadoId, ubicacionDestinoId, estado, createdAt',
      compras: '++id, tenantId, folio, proveedorId, productoId, tipo, estado, createdAt',
      ventas: '++id, tenantId, folio, clienteId, productoId, tipoEntrega, estado, createdAt',
      transfers: '++id, tenantId, folio, productoId, ubicacionOrigenId, ubicacionDestinoId, status, fechaSolicitud, createdAt',
      attendance: '++id, tenantId, employeeId, action, timestamp, createdAt',
      cashFlow: '++id, tenantId, amount, movementType, sourceType, createdAt',
      syncQueue: '++id, tenantId, operation, table, synced, createdAt',
      userRoles: '++id, tenantId, name, createdAt',
      locationTypes: '++id, tenantId, name, createdAt',
      folioSequences: '++id, tenantId, prefix, currentNumber, createdAt',
      terminals: '++id, tenantId, name, deviceId, createdAt',
      terminalSessions: '++id, tenantId, terminalId, employeeId, startedAt, createdAt',
    });
  }
}

export const db = new ERPDB();
