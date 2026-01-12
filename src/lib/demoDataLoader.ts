import {storage} from './storage';

// Función para cargar datos demo desde archivos JSON
export async function loadDemoData() {
  try {
    console.log('🚀 Iniciando carga de datos demo...');

    // Cargar productos
    const productosResponse = await fetch('/demo_data_coco_factory/fabrica_coco/productos.json');
    const productos = await productosResponse.json();
    for (const producto of productos) {
      await storage.productos.add(producto);
    }
    console.log(`📦 ${productos.length} productos cargados`);

    // Cargar ubicaciones
    const ubicacionesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/ubicaciones.json');
    const ubicaciones = await ubicacionesResponse.json();
    for (const ubicacion of ubicaciones) {
      await storage.ubicaciones.add(ubicacion);
    }
    console.log(`🏭 ${ubicaciones.length} ubicaciones cargadas`);

    // Cargar tipos de ubicación
    const locationTypesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/locationTypes.json');
    const locationTypes = await locationTypesResponse.json();
    for (const locationType of locationTypes) {
      await storage.locationTypes.add(locationType);
    }
    console.log(`🏷️ ${locationTypes.length} tipos de ubicación cargados`);

    // Cargar empleados
    const empleadosResponse = await fetch('/demo_data_coco_factory/fabrica_coco/empleados.json');
    const empleados = await empleadosResponse.json();
    for (const empleado of empleados) {
      await storage.empleados.add(empleado);
    }
    console.log(`👥 ${empleados.length} empleados cargados`);

    // Cargar proveedores
    const proveedoresResponse = await fetch('/demo_data_coco_factory/fabrica_coco/proveedores.json');
    const proveedores = await proveedoresResponse.json();
    for (const proveedor of proveedores) {
      await storage.proveedores.add(proveedor);
    }
    console.log(`🏪 ${proveedores.length} proveedores cargados`);

    // Cargar clientes
    const clientesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/clientes.json');
    const clientes = await clientesResponse.json();
    for (const cliente of clientes) {
      await storage.clientes.add(cliente);
    }
    console.log(`🛒 ${clientes.length} clientes cargados`);

    // Cargar procesos
    const procesosResponse = await fetch('/demo_data_coco_factory/fabrica_coco/procesos.json');
    const procesos = await procesosResponse.json();
    for (const proceso of procesos) {
      await storage.procesos.add(proceso);
    }
    console.log(`⚙️ ${procesos.length} procesos cargados`);

    // Cargar tipos de proceso
    const processTypesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/processTypes.json');
    const processTypes = await processTypesResponse.json();
    for (const processType of processTypes) {
      await storage.processTypes.add(processType);
    }
    console.log(`🔧 ${processTypes.length} tipos de proceso cargados`);

    // Cargar inventario
    const inventarioResponse = await fetch('/demo_data_coco_factory/fabrica_coco/inventario.json');
    const inventario = await inventarioResponse.json();
    for (const item of inventario) {
      await storage.inventario.add(item);
    }
    console.log(`📦 ${inventario.length} items de inventario cargados`);

    // Cargar ventas
    const ventasResponse = await fetch('/demo_data_coco_factory/fabrica_coco/ventas.json');
    const ventas = await ventasResponse.json();
    for (const venta of ventas) {
      await storage.ventas.add(venta);
    }
    console.log(`💰 ${ventas.length} ventas cargadas`);

    // Cargar compras
    const comprasResponse = await fetch('/demo_data_coco_factory/fabrica_coco/compras.json');
    const compras = await comprasResponse.json();
    for (const compra of compras) {
      await storage.compras.add(compra);
    }
    console.log(`🛒 ${compras.length} compras cargadas`);

    // Cargar tickets de producción
    const produccionTicketsResponse = await fetch('/demo_data_coco_factory/fabrica_coco/produccionTickets.json');
    const produccionTickets = await produccionTicketsResponse.json();
    for (const ticket of produccionTickets) {
      await storage.produccionTickets.add(ticket);
    }
    console.log(`🎫 ${produccionTickets.length} tickets de producción cargados`);

    // Cargar producción
    const produccionResponse = await fetch('/demo_data_coco_factory/fabrica_coco/produccion.json');
    const produccion = await produccionResponse.json();
    for (const prod of produccion) {
      await storage.produccion.add(prod);
    }
    console.log(`🏭 ${produccion.length} registros de producción cargados`);

    // Cargar gastos
    const gastosResponse = await fetch('/demo_data_coco_factory/fabrica_coco/gastos.json');
    const gastos = await gastosResponse.json();
    for (const gasto of gastos) {
      await storage.gastos.add(gasto);
    }
    console.log(`💸 ${gastos.length} gastos cargados`);

    // Cargar auditorías
    const auditoriasResponse = await fetch('/demo_data_coco_factory/fabrica_coco/auditorias.json');
    const auditorias = await auditoriasResponse.json();
    for (const auditoria of auditorias) {
      await storage.auditorias.add(auditoria);
    }
    console.log(`🔍 ${auditorias.length} auditorías cargadas`);

    // Cargar asistencia
    const asistenciaResponse = await fetch('/demo_data_coco_factory/fabrica_coco/attendance.json');
    const asistencia = await asistenciaResponse.json();
    for (const asistenciaItem of asistencia) {
      await storage.attendance.add(asistenciaItem);
    }
    console.log(`⏰ ${asistencia.length} registros de asistencia cargados`);

    // Cargar flujo de caja
    const cashFlowResponse = await fetch('/demo_data_coco_factory/fabrica_coco/cashFlow.json');
    const cashFlow = await cashFlowResponse.json();
    for (const cashFlowItem of cashFlow) {
      await storage.cashFlow.add(cashFlowItem);
    }
    console.log(`💵 ${cashFlow.length} registros de flujo de caja cargados`);

    // Cargar secuencias de folio
    const folioSequencesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/folioSequences.json');
    const folioSequences = await folioSequencesResponse.json();
    for (const sequence of folioSequences) {
      await storage.folioSequences.add(sequence);
    }
    console.log(`🔢 ${folioSequences.length} secuencias de folio cargadas`);

    // Cargar roles de usuario
    const userRolesResponse = await fetch('/demo_data_coco_factory/fabrica_coco/userRoles.json');
    const userRoles = await userRolesResponse.json();
    for (const role of userRoles) {
      await storage.userRoles.add(role);
    }
    console.log(`👤 ${userRoles.length} roles de usuario cargados`);

    console.log('✅ Todos los datos demo han sido cargados exitosamente!');

  } catch (error) {
    console.error('❌ Error cargando datos demo:', error);
    throw error;
  }
}

// Función para verificar si ya hay datos cargados
export async function hasDemoData(): Promise<boolean> {
  try {
    const productos = await storage.productos.getAll();
    const ventas = await storage.ventas.getAll();
    const compras = await storage.compras.getAll();

    return productos.length > 0 || ventas.length > 0 || compras.length > 0;
  } catch (error) {
    console.error('Error verificando datos demo:', error);
    return false;
  }
}

// Función para limpiar todos los datos
export async function clearAllData() {
  try {
    console.log('🗑️ Limpiando todos los datos...');

    // Limpiar todas las tablas
    await storage.productos.clear();
    await storage.ubicaciones.clear();
    await storage.locationTypes.clear();
    await storage.empleados.clear();
    await storage.proveedores.clear();
    await storage.clientes.clear();
    await storage.procesos.clear();
    await storage.processTypes.clear();
    await storage.inventario.clear();
    await storage.ventas.clear();
    await storage.compras.clear();
    await storage.produccionTickets.clear();
    await storage.produccion.clear();
    await storage.gastos.clear();
    await storage.auditorias.clear();
    await storage.attendance.clear();
    await storage.cashFlow.clear();
    await storage.folioSequences.clear();
    await storage.userRoles.clear();

    console.log('✅ Todos los datos han sido limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
    throw error;
  }
}
