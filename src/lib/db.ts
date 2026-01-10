import Dexie, {Table} from 'dexie';

// Interfaces para las tablas principales del ERP
export interface Cliente {
  id?: number;
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
  nombre: string;
  descripcion?: string;
  precioMin: number;
  precioMax: number;
  precioActual: number;
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
  nombre: string;
  rol: string; // Reference to user_roles.name
  email?: string;
  telefono?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ubicacion {
  id?: number;
  nombre: string;
  tipo: string; // Reference to location_types.name
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proceso {
  id?: number;
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
  productoId: number;
  ubicacionId: number;
  cantidad: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProduccionTicket {
  id?: number;
  folio?: string; // Nuevo campo para folio automático
  processId: number;
  employeeId: number;
  insumos: { productoId: number; cantidad: number; locationId: number }[]; // Actualizado para incluir ubicación
  productoTerminadoId: number;
  cantidadProducida: number;
  ubicacionDestinoId: number;
  firmaEmpleadoBase64?: string;
  faceAuthData?: Record<string, unknown>; // Datos biométricos
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  // Campos de pago
  paymentAmount?: number;
  paymentMethod?: 'efectivo' | 'transferencia' | 'cheque';
  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  paidAt?: Date;
  // Campos adicionales
  notes?: string;
  supervisorNotes?: string;
  qualityCheck?: boolean;
  qualityNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Compra {
  id?: number;
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

export interface SyncQueue {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  createdAt: Date;
  synced: boolean;
}

export interface CashFlow {
  id?: number;
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
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationType {
  id?: number;
  name: string;
  description?: string;
  productosPermitidos?: number[]; // IDs de productos permitidos
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessType {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolioSequence {
  id?: number;
  prefix: string;
  description?: string;
  currentNumber: number;
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
  cashFlow!: Table<CashFlow>;
  syncQueue!: Table<SyncQueue>;
  userRoles!: Table<UserRole>;
  locationTypes!: Table<LocationType>;
  processTypes!: Table<ProcessType>;
  folioSequences!: Table<FolioSequence>;

  constructor() {
    super('erp_modular');
    this.version(4).stores({
      clientes: '++id, nombre, rfc, email, createdAt',
      proveedores: '++id, nombre, rfc, email, createdAt',
      productos: '++id, nombre, precioActual, createdAt',
      empleados: '++id, nombre, rol, email, createdAt',
      ubicaciones: '++id, nombre, tipo, createdAt',
      procesos: '++id, nombre, ubicacionId, requiereFaceAuth, createdAt',
      inventario: '++id, productoId, ubicacionId, cantidad, createdAt',
      produccionTickets: '++id, folio, procesoId, empleadoId, estado, createdAt',
      compras: '++id, folio, proveedorId, productoId, tipo, estado, createdAt',
      ventas: '++id, folio, clienteId, productoId, tipoEntrega, estado, createdAt',
      cashFlow: '++id, amount, movementType, sourceType, createdAt',
      syncQueue: '++id, operation, table, synced, createdAt',
      userRoles: '++id, name, createdAt',
      locationTypes: '++id, name, createdAt',
      processTypes: '++id, name, createdAt',
      folioSequences: '++id, prefix, currentNumber, createdAt',
    });
  }
}

export const db = new ERPDB();
