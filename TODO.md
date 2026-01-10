# ✅ CHECKLIST COMPLETO ERP MODULAR - IMPLEMENTACIÓN TOTAL

**Sistema de seguimiento de tareas para proyecto 100% operativo y funcional**

---

## 📋 ÍNDICE DE FASES

- [FASE 0: Estructura Base](#fase-0-estructura-base) (35 tareas)
- [FASE 1: Núcleo Operativo Crítico](#fase-1-núcleo-operativo-crítico) (58 tareas)
- [FASE 2: Financiera y Administrativa](#fase-2-financiera-y-administrativa) (42 tareas)
- [FASE 3: Operacional y Cierres](#fase-3-operacional-y-cierres) (28 tareas)
- [FASE 4: Optimizaciones y Producción](#fase-4-optimizaciones-y-producción) (25 tareas)

**TOTAL: 188 tareas**

---

## FASE 0: ESTRUCTURA BASE

*Objetivo: Establecer cimientos técnicos, seguridad y estructura modular*

### 0.1 Configuración Inicial del Proyecto

- [x] **0.1.1** Crear repositorio Git `erp-modular`
- [x] **0.1.2** Verificar y documentar estructura de carpetas existente:
  ```
  /src/components        # Componentes React reutilizables
  /src/lib               # Librerías y utilidades (ej: supabase)
  /public                # Archivos estáticos (si aplica)
  /dist                  # Salida de build
  /node_modules          # Dependencias
  /.config y archivos raíz (tailwind.config.js, vite.config.ts, etc)
  ```
  > Nota: Adaptar nuevas carpetas solo si son necesarias y justificadas para el flujo real del proyecto. Mantener la
  estructura actual lo más posible.
- [x] **0.1.3** Inicializar proyecto React con TypeScript
- [x] **0.1.4** Configurar Tailwind CSS
- [x] **0.1.5** Configurar variables de entorno (.env.example y .env.local)
- [x] **0.1.6** Crear archivo CHANGELOG.md
- [x] **0.1.7** Crear archivo README.md con instrucciones de instalación
- [x] **0.1.8** Configurar ESLint y Prettier
- [x] **0.1.9** Configurar Git hooks (pre-commit, pre-push)
- [x] **0.1.10** Crear cuenta y proyecto en Supabase
- [x] **0.1.11** Validar conectividad con Supabase
- [x] **0.1.12** Configurar buckets de Storage en Supabase

### 0.2 Base de Datos - Tablas Core

- [x] **0.2.1** Crear migración `00001_init.sql` con extensiones (uuid-ossp, pgcrypto)
- [x] **0.2.2** Crear tipos ENUM (user_role, location_type, process_type, etc.)
- [x] **0.2.3** Crear tabla `users` extendida de auth.users
- [x] **0.2.4** Crear tabla `roles` con permisos JSONB
- [x] **0.2.5** Crear tabla `audit_logs` con estructura completa
- [x] **0.2.6** Crear índices en audit_logs (user_id, table_name, created_at)
- [x] **0.2.7** Ejecutar migración y verificar tablas
- [x] **0.2.8** Crear seeds de roles iniciales (owner, admin, supervisor, cajero, empleado)

### 0.3 Sistema de Auditoría

- [x] **0.3.1** Crear función `audit_trigger_function()` en migración `00002_audit.sql`
- [x] **0.3.2** Aplicar trigger de auditoría a tabla `users`
- [ ] **0.3.3** Probar trigger con INSERT/UPDATE/DELETE de prueba (requiere usuario en auth.users)
- [ ] **0.3.4** Crear componente React `<AuditLog />` para visualización
- [ ] **0.3.5** Crear página `/auditoria` con filtros (usuario, tabla, fecha)
- [ ] **0.3.6** Implementar paginación en listado de auditoría
- [ ] **0.3.7** Validar que cada operación CRUD genera registro auditado

### 0.4 Autenticación y Control de Tiempo

- [ ] **0.4.1** Configurar Supabase Auth (email + password)
- [ ] **0.4.2** Crear migración `00003_attendance.sql`
- [ ] **0.4.3** Crear tabla `attendance` con check_in/check_out
- [ ] **0.4.4** Crear Edge Function `/supabase/functions/attendance/index.ts`
- [ ] **0.4.5** Implementar lógica de check-in (validar entrada activa)
- [ ] **0.4.6** Implementar lógica de check-out
- [ ] **0.4.7** Configurar Face Auth en kioskos (solo captura biométrica, no login)
- [ ] **0.4.8** Crear interfaz de kiosko para registro de asistencia
- [ ] **0.4.9** Crear página `/asistencias` para supervisores
- [ ] **0.4.10** Validar que Face Auth NO se use para login general del ERP

### 0.5 Ubicaciones y Procesos

- [x] **0.5.1** Crear migración `00004_locations_processes.sql`
- [x] **0.5.2** Crear tabla `locations` con tipos (patio, bodega, tanque)
- [x] **0.5.3** Crear tabla `processes` con referencia a locations
- [x] **0.5.4** Crear vista `vw_process_locations`
- [x] **0.5.5** Aplicar triggers de auditoría a ambas tablas
- [x] **0.5.6** Insertar seeds de ubicaciones (Patio, Bodega Central, Tanque 1, etc.)
- [x] **0.5.7** Insertar seeds de procesos (Destopado, Deshuesado, Pelado, Pagos)
- [x] **0.5.8** Marcar qué procesos requieren Face Auth
- [ ] **0.5.9** Crear página `/configuracion/ubicaciones` con CRUD
- [ ] **0.5.10** Crear página `/configuracion/procesos` con CRUD

### 0.6 Sistema de Productos e Inventario

- [ ] **0.6.1** Crear migración `00005_products.sql`
- [ ] **0.6.2** Crear tabla `products` con rangos de precios (min/max)
- [ ] **0.6.3** Crear constraint `valid_price_range` y `valid_current_price`
- [ ] **0.6.4** Crear tabla `inventory` (product_id, location_id, quantity)
- [ ] **0.6.5** Crear tabla `inventory_movements` con tipos de movimiento
- [ ] **0.6.6** Crear función `update_inventory_on_movement()` con trigger
- [ ] **0.6.7** Aplicar triggers de auditoría
- [ ] **0.6.8** Insertar productos de prueba con rangos de precio
- [ ] **0.6.9** Crear página `/productos` con CRUD y validación de precios
- [ ] **0.6.10** Crear página `/inventario` con vista por ubicaciones
- [ ] **0.6.11** Implementar alertas cuando precio esté fuera de rango
- [ ] **0.6.12** Validar que movimientos actualicen stock automáticamente

---

## FASE 1: NÚCLEO OPERATIVO CRÍTICO

*Objetivo: Implementar flujos completos con impacto en inventario, contabilidad y trazabilidad*

### 1.1 Sistema de Folios Automáticos

- [x] **1.1.1** Crear migración `00006_folios.sql`
- [x] **1.1.2** Crear tabla `folio_sequences` con prefijos
- [x] **1.1.3** Insertar secuencias: PROD, COMP, VENT, TRAS, DEV
- [x] **1.1.4** Crear función `generate_folio(prefix)` con formato YYYYMMDD
- [x] **1.1.5** Probar generación con diferentes prefijos
- [x] **1.1.6** Documentar formato en README

### 1.2 Módulo de Clientes Completo

- [ ] **1.2.1** Crear migración `00007_clients.sql`
- [ ] **1.2.2** Crear tabla `clients` con todos los campos (RFC, datos bancarios, etc.)
- [ ] **1.2.3** Crear tabla `client_documents` para archivos
- [ ] **1.2.4** Aplicar triggers de auditoría
- [ ] **1.2.5** Configurar RLS (Row Level Security)
- [ ] **1.2.6** Crear bucket Storage `/firmas/clientes/`
- [ ] **1.2.7** Crear bucket Storage `/documentos/clientes/`
- [ ] **1.2.8** Crear Edge Function `/functions/clients/signature.ts`
- [ ] **1.2.9** Implementar decodificación base64 y subida a Storage
- [ ] **1.2.10** Crear componente `<ClientForm />` con validaciones
- [ ] **1.2.11** Crear componente `<SignatureCanvas />` para firma digital
- [ ] **1.2.12** Crear componente `<DocumentUpload />` para PDFs/JPGs
- [ ] **1.2.13** Crear página `/clientes` con listado y búsqueda
- [ ] **1.2.14** Implementar modal de alta/edición de cliente
- [ ] **1.2.15** Validar RFC con formato correcto
- [ ] **1.2.16** Implementar notificación a admin al intentar borrar
- [ ] **1.2.17** Validar que firma se almacene solo la primera vez
- [ ] **1.2.18** Mostrar firma guardada en perfil de cliente

### 1.3 Módulo de Proveedores Completo

- [ ] **1.3.1** Crear migración `00008_providers.sql`
- [ ] **1.3.2** Crear tabla `providers` (estructura similar a clients)
- [ ] **1.3.3** Crear tabla `provider_documents`
- [ ] **1.3.4** Aplicar triggers de auditoría y RLS
- [ ] **1.3.5** Crear bucket Storage `/firmas/proveedores/`
- [ ] **1.3.6** Crear bucket Storage `/documentos/proveedores/`
- [ ] **1.3.7** Reutilizar Edge Function de firmas (parametrizada)
- [ ] **1.3.8** Crear componente `<ProviderForm />`
- [ ] **1.3.9** Crear página `/proveedores` con CRUD
- [ ] **1.3.10** Implementar mismas validaciones que clientes
- [ ] **1.3.11** Validar notificación a admin en borrados

### 1.4 Flujo de Producción (Triple Registro)

- [ ] **1.4.1** Crear migración `00009_production.sql`
- [ ] **1.4.2** Crear tabla `production_tickets` con todos los campos
- [ ] **1.4.3** Agregar campo `input_items` JSONB para insumos
- [ ] **1.4.4** Agregar campos de firma y Face Auth
- [ ] **1.4.5** Aplicar trigger de auditoría
- [ ] **1.4.6** Crear Edge Function `/functions/production/register.ts`
- [ ] **1.4.7** Implementar paso 1: Crear ticket de producción
- [ ] **1.4.8** Implementar paso 2: REGISTRO FÍSICO - Consumir insumos (restar inventario)
- [ ] **1.4.9** Implementar paso 3: REGISTRO FÍSICO - Sumar producto terminado
- [ ] **1.4.10** Implementar paso 4: REGISTRO CONTABLE - Egreso en caja por labor
- [ ] **1.4.11** Implementar paso 5: REGISTRO LOGÍSTICO - Rastreo de movimientos
- [ ] **1.4.12** Crear Edge Function `/functions/production/complete.ts`
- [x] **1.4.13** Implementar solicitud de firma digital del empleado
- [x] **1.4.14** Implementar Face Auth si proceso es sensible
- [x] **1.4.15** Generar comprobante PDF para pago en caja
- [x] **1.4.16** Crear componente `<ProductionForm />`
- [x] **1.4.17** Crear selector de proceso y empleado
- [x] **1.4.18** Crear selector de insumos con ubicaciones
- [x] **1.4.19** Crear selector de producto terminado y ubicación destino
- [x] **1.4.20** Crear página `/produccion` con listado de tickets
- [x] **1.4.21** Implementar estados del ticket (pendiente, en_proceso, completado)
- [x] **1.4.22** Crear interfaz de kiosko para firma del empleado
- [x] **1.4.23** Validar que inventario se actualice correctamente
- [x] **1.4.24** Validar que se genere movimiento contable
- [x] **1.4.25** Validar trazabilidad completa en auditoría

### 1.5 Flujo de Compras Completo

- [ ] **1.5.1** Crear migración `00010_purchases.sql`
- [ ] **1.5.2** Crear tabla `purchases` con todos los campos
- [ ] **1.5.3** Crear tabla `purchase_freight` para datos de flete
- [ ] **1.5.4** Crear tabla `purchase_signatures` para múltiples firmas
- [ ] **1.5.5** Crear campos de estados y horarios (salida, carga, regreso, etc.)
- [ ] **1.5.6** Aplicar triggers de auditoría
- [ ] **1.5.7** Crear Edge Function `/functions/purchases/register.ts`
- [ ] **1.5.8** Implementar lógica para compra en parcela
- [ ] **1.5.9** Implementar lógica para compra en planta/puerta
- [ ] **1.5.10** Implementar REGISTRO FÍSICO - Sumar inventario
- [ ] **1.5.11** Implementar REGISTRO CONTABLE - Egreso o CxP
- [ ] **1.5.12** Implementar REGISTRO LOGÍSTICO - Trazabilidad de transporte
- [ ] **1.5.13** Crear Edge Function `/functions/purchases/update-status.ts`
- [ ] **1.5.14** Implementar cambio de estados con timestamps
- [ ] **1.5.15** Crear Edge Function `/functions/purchases/signature.ts`
- [ ] **1.5.16** Implementar firma del conductor al cargar (parcela)
- [ ] **1.5.17** Implementar firma del encargado al descargar
- [ ] **1.5.18** Implementar firma del proveedor al entregar
- [ ] **1.5.19** Crear componente `<PurchaseForm />`
- [ ] **1.5.20** Crear selector de proveedor y producto
- [ ] **1.5.21** Crear selector de tipo: parcela o planta
- [ ] **1.5.22** Crear sección de flete (vehículo, conductor) condicional
- [ ] **1.5.23** Crear página `/compras` con listado y filtros
- [ ] **1.5.24** Crear vista móvil para conductores con estados
- [ ] **1.5.25** Implementar captura de firma digital en móvil del conductor
- [ ] **1.5.26** Implementar captura de firma en kiosko del encargado
- [ ] **1.5.27** Validar solicitud de Face Auth ante anomalías
- [ ] **1.5.28** Validar que inventario se actualice al completar
- [ ] **1.5.29** Validar que se genere movimiento contable correcto
- [ ] **1.5.30** Validar trazabilidad de todas las firmas

### 1.6 Flujo de Ventas Completo

- [ ] **1.6.1** Crear migración `00011_sales.sql`
- [ ] **1.6.2** Crear tabla `sales` con todos los campos
- [ ] **1.6.3** Crear tabla `sale_freight` para entregas
- [ ] **1.6.4** Crear tabla `sale_signatures`
- [ ] **1.6.5** Crear campos de tipo de entrega (cliente recoge, flete propio, flete externo)
- [ ] **1.6.6** Aplicar triggers de auditoría
- [ ] **1.6.7** Crear Edge Function `/functions/sales/register.ts`
- [ ] **1.6.8** Implementar REGISTRO FÍSICO - Restar inventario
- [ ] **1.6.9** Implementar REGISTRO CONTABLE - Ingreso o CxC
- [ ] **1.6.10** Implementar REGISTRO LOGÍSTICO - Trazabilidad de entrega
- [ ] **1.6.11** Crear Edge Function `/functions/sales/update-status.ts`
- [ ] **1.6.12** Crear Edge Function `/functions/sales/signature.ts`
- [ ] **1.6.13** Implementar firma del cliente al recibir (móvil o kiosko)
- [ ] **1.6.14** Implementar firma del conductor al entregar
- [ ] **1.6.15** Implementar firma del cliente al pagar en efectivo
- [ ] **1.6.16** Crear componente `<SaleForm />`
- [ ] **1.6.17** Crear selector de cliente y producto
- [ ] **1.6.18** Crear selector de tipo de entrega
- [ ] **1.6.19** Crear sección de flete condicional
- [ ] **1.6.20** Crear validación de disponibilidad de inventario
- [ ] **1.6.21** Crear página `/ventas` con listado
- [ ] **1.6.22** Implementar estados (pendiente, en_preparacion, en_transito, entregado)
- [ ] **1.6.23** Crear vista móvil para conductores
- [ ] **1.6.24** Validar firma del cliente en punto correcto
- [ ] **1.6.25** Generar comprobante de venta PDF
- [ ] **1.6.26** Subir comprobante a Storage `/tickets/ventas/`
- [ ] **1.6.27** Validar actualización de inventario
- [ ] **1.6.28** Validar movimiento contable correcto
- [ ] **1.6.29** Validar trazabilidad completa

---

## FASE 2: FINANCIERA Y ADMINISTRATIVA

*Objetivo: Consolidar control contable, financiero y auditoría integral*

### 2.1 Módulo de Cuentas por Cobrar (CxC)

- [ ] **2.1.1** Crear migración `00012_accounts_receivable.sql`
- [ ] **2.1.2** Crear tabla `accounts_receivable`
- [ ] **2.1.3** Crear tabla `ar_payments` para abonos
- [ ] **2.1.4** Aplicar triggers de auditoría
- [ ] **2.1.5** Crear vista `vw_cxc_estado_cuenta` con saldos
- [ ] **2.1.6** Crear función `calculate_overdue_days()`
- [ ] **2.1.7** Crear Edge Function `/functions/ar/apply-payment.ts`
- [ ] **2.1.8** Implementar aplicación de abonos parciales
- [ ] **2.1.9** Implementar cálculo de saldo pendiente
- [ ] **2.1.10** Crear componente `<ARForm />` para alta de crédito
- [ ] **2.1.11** Crear página `/cuentas-por-cobrar` con listado
- [ ] **2.1.12** Implementar filtros (cliente, vencimiento, saldo)
- [ ] **2.1.13** Crear modal de aplicación de pago
- [ ] **2.1.14** Implementar alertas de vencimiento (7 días antes)
- [ ] **2.1.15** Crear reporte de estado de cuenta por cliente
- [ ] **2.1.16** Validar integración con ventas a crédito

### 2.2 Módulo de Cuentas por Pagar (CxP)

- [ ] **2.2.1** Crear migración `00013_accounts_payable.sql`
- [ ] **2.2.2** Crear tabla `accounts_payable`
- [ ] **2.2.3** Crear tabla `ap_payments`
- [ ] **2.2.4** Aplicar triggers de auditoría
- [ ] **2.2.5** Crear vista `vw_cxp_estado_cuenta`
- [ ] **2.2.6** Crear Edge Function `/functions/ap/apply-payment.ts`
- [ ] **2.2.7** Crear componente `<APForm />`
- [ ] **2.2.8** Crear página `/cuentas-por-pagar` con listado
- [ ] **2.2.9** Implementar filtros y alertas de vencimiento
- [ ] **2.2.10** Crear reporte de estado de cuenta por proveedor
- [ ] **2.2.11** Validar integración con compras a crédito

### 2.3 Módulo de Cotizaciones

- [ ] **2.3.1** Crear migración `00014_quotes.sql`
- [ ] **2.3.2** Crear tabla `quotes` con items JSONB
- [ ] **2.3.3** Crear estados (borrador, enviada, aprobada, rechazada)
- [ ] **2.3.4** Aplicar trigger de auditoría
- [ ] **2.3.5** Crear Edge Function `/functions/quotes/approve.ts`
- [ ] **2.3.6** Implementar conversión de cotización a venta
- [ ] **2.3.7** Crear componente `<QuoteForm />`
- [ ] **2.3.8** Crear selector de productos con precios
- [ ] **2.3.9** Implementar cálculo automático de totales
- [ ] **2.3.10** Crear página `/cotizaciones` con listado
- [ ] **2.3.11** Implementar acciones (aprobar, rechazar, editar)
- [ ] **2.3.12** Generar PDF de cotización
- [ ] **2.3.13** Enviar cotización por email (opcional)
- [ ] **2.3.14** Validar que cotización aprobada genere venta con folio

### 2.4 Módulo de Caja y Capital

- [ ] **2.4.1** Crear migración `00015_cash_flow.sql`
- [ ] **2.4.2** Crear tabla `cash_flow` con tipos (ingreso, egreso)
- [ ] **2.4.3** Crear campo `source_type` (venta, compra, capital, nomina, etc.)
- [ ] **2.4.4** Aplicar trigger de auditoría
- [ ] **2.4.5** Crear vista `vw_cash_balance` con saldo actual
- [ ] **2.4.6** Crear función `register_cash_movement()`
- [ ] **2.4.7** Integrar con ventas (ingreso automático)
- [ ] **2.4.8** Integrar con compras (egreso automático)
- [ ] **2.4.9** Integrar con producción (egreso por labor)
- [ ] **2.4.10** Crear componente `<CashMovementForm />` para registros manuales
- [ ] **2.4.11** Crear página `/caja` con movimientos del día
- [ ] **2.4.12** Implementar arqueo de caja
- [ ] **2.4.13** Crear reporte semanal automatizado
- [ ] **2.4.14** Generar archivo CSV en `/storage/reportes/caja/`
- [ ] **2.4.15** Implementar conciliación automática
- [ ] **2.4.16** Validar diferenciación entre ingreso por venta vs capital

### 2.5 Devoluciones y Notas de Crédito

- [ ] **2.5.1** Crear migración `00016_returns.sql`
- [ ] **2.5.2** Crear tabla `returns` referenciando sale_id
- [ ] **2.5.3** Crear tabla `credit_notes` con montos
- [ ] **2.5.4** Aplicar triggers de auditoría
- [ ] **2.5.5** Crear Edge Function `/functions/returns/register.ts`
- [ ] **2.5.6** Implementar REGISTRO FÍSICO - Sumar inventario devuelto
- [ ] **2.5.7** Implementar REGISTRO CONTABLE - Nota de crédito
- [ ] **2.5.8** Implementar aplicación automática a CxC
- [ ] **2.5.9** Crear componente `<ReturnForm />`
- [ ] **2.5.10** Crear página `/devoluciones` con listado
- [ ] **2.5.11** Generar PDF de nota de crédito
- [ ] **2.5.12** Validar trazabilidad completa

---

## FASE 3: OPERACIONAL Y CIERRES

*Objetivo: Control total, reportes y permisos avanzados*

### 3.1 Sistema de Impresión

- [ ] **3.1.1** Instalar librería de generación de PDFs (jsPDF o similar)
- [ ] **3.1.2** Crear plantilla de ticket 58mm
- [ ] **3.1.3** Crear plantilla de recibo carta
- [ ] **3.1.4** Implementar generación de ticket de venta
- [ ] **3.1.5** Implementar generación de ticket de compra
- [ ] **3.1.6** Implementar generación de ticket de producción
- [ ] **3.1.7** Subir PDFs generados a Storage `/tickets/`
- [ ] **3.1.8** Crear componente `<PrintButton />` reutilizable
- [ ] **3.1.9** Implementar impresión desde kiosko
- [ ] **3.1.10** Implementar impresión desde móvil
- [ ] **3.1.11** Implementar impresión desde escritorio
- [ ] **3.1.12** Validar formato correcto en ambos tamaños

### 3.2 Permisos Granulares

- [ ] **3.2.1** Crear migración `00017_permissions.sql`
- [ ] **3.2.2** Crear tabla `permissions` con acciones (read, create, update, delete, approve)
- [ ] **3.2.3** Crear tabla `role_permissions` (relación muchos a muchos)
- [ ] **3.2.4** Crear tabla `terminal_permissions` (restricciones por dispositivo)
- [ ] **3.2.5** Aplicar triggers de auditoría
- [ ] **3.2.6** Crear función `check_permission(user_id, action, resource)`
- [ ] **3.2.7** Implementar middleware de permisos en Edge Functions
- [ ] **3.2.8** Crear página `/configuracion/permisos` (solo admin)
- [ ] **3.2.9** Implementar asignación de permisos por rol
- [ ] **3.2.10** Implementar restricciones por terminal (kiosko, móvil, escritorio)
- [ ] **3.2.11** Validar que permisos se respeten en todas las operaciones

### 3.3 Traslados entre Ubicaciones

- [ ] **3.3.1** Crear migración `00018_transfers.sql`
- [ ] **3.3.2** Crear tabla `transfers` con origen y destino
- [ ] **3.3.3** Aplicar trigger de auditoría
- [ ] **3.3.4** Crear Edge Function `/functions/transfers/register.ts`
- [ ] **3.3.5** Implementar REGISTRO FÍSICO - Restar de origen y sumar a destino
- [ ] **3.3.6** Implementar REGISTRO LOGÍSTICO - Trazabilidad
- [ ] **3.3.7** Crear componente `<TransferForm />`
- [ ] **3.3.8** Crear página `/traslados` con listado
- [ ] **3.3.9** Implementar validación de disponibilidad en origen
- [ ] **3.3.10** Validar actualización correcta de inventario

### 3.4 Cierres de Periodo

- [ ] **3.4.1** Crear migración `00019_closures.sql`
- [ ] **3.4.2** Crear tabla `period_closures` (semanal, mensual)
- [ ] **3.4.3** Crear tabla `closure_snapshots` con datos congelados
- [ ] **3.4.4** Aplicar trigger de auditoría
- [ ] **3.4.5** Crear Edge Function `/functions/closures/close-period.ts`
- [ ] **3.4.6** Implementar validación de datos (inventario vs contable)
- [ ] **3.4.7** Implementar bloqueo de edición de registros cerrados
- [ ] **3.4.8** Generar resumen financiero del periodo
- [ ] **3.4.9** Generar reporte de inventario
- [ ] **3.4.10** Generar PDF de cierre
- [ ] **3.4.11** Subir PDF a Storage `/reportes/cierres/`
- [ ] **3.4.12** Crear página `/cierres` con historial
- [ ] **3.4.13** Implementar aprobación de cierre (requiere admin/owner)
- [ ] **3.4.14** Validar que registros cerrados no se puedan editar
- [ ] **3.4.15** Crear notificación automática de cierre

---

## FASE 4: OPTIMIZACIONES Y PRODUCCIÓN

*Objetivo: Preparar sistema para uso real y escala*

### 4.1 Optimizaciones de Rendimiento

- [ ] **4.1.1** Crear índices adicionales en tablas grandes
- [ ] **4.1.2** Implementar paginación en todos los listados
- [ ] **4.1.3** Implementar lazy loading de imágenes
- [ ] **4.1.4** Optimizar queries con vistas materializadas
- [ ] **4.1.5** Implementar caché en Edge Functions críticas
- [ ] **4.1.6** Comprimir imágenes antes de subir a Storage
- [ ] **4.1.7** Implementar debounce en búsquedas

### 4.2 Seguridad y Respaldos

- [ ] **4.2.1** Configurar políticas RLS en todas las tablas
- [ ] **4.2.2** Implementar rate limiting en Edge Functions
- [ ] **4.2.3** Configurar backup automático diario en Supabase
- [ ] **4.2.4** Crear script de exportación de datos críticos
- [ ] **4.2.5** Implementar encriptación en campos sensibles (datos bancarios)
- [ ] **4.2.6** Configurar SSL/TLS en todas las conexiones
- [ ] **4.2.7** Implementar validación de CORS
- [ ] **4.2.8** Crear política de expiración de sesiones
- [ ] **4.2.9** Implementar logs de seguridad (intentos fallidos)
- [ ] **4.2.10** Configurar alertas de accesos sospechosos

### 4.3 Testing y Quality Assurance

- [ ] **4.3.1** Configurar framework de testing (Jest, Vitest)
- [ ] **4.3.2** Crear tests unitarios para funciones críticas
- [ ] **4.3.3** Crear tests de integración para flujos completos
- [ ] **4.3.4** Implementar tests E2E with Playwright o Cypress
- [ ] **4.3.5** Crear suite de tests para Edge Functions
- [ ] **4.3.6** Validar cobertura de código (mínimo 70%)
- [ ] **4.3.7** Implementar CI/CD with GitHub Actions
- [ ] **4.3.8** Configurar pre-push hooks with tests obligatorios

### 4.4 Documentación Final

- [ ] **4.4.1** Actualizar README.md con instalación completa
- [ ] **4.4.2** Documentar todas las Edge Functions
- [ ] **4.4.3** Crear diagrama de arquitectura del sistema
- [ ] **4.4.4** Documentar flujos de negocio principales
- [ ] **4.4.5** Crear guía de usuario para cada módulo
- [ ] **4.4.6** Documentar API endpoints y parámetros
- [ ] **4.4.7** Crear troubleshooting guide
- [ ] **4.4.8** Documentar proceso de deployment

### 4.5 Preparación para Producción

- [ ] **4.5.1** Crear ambiente de staging
- [ ] **4.5.2** Configurar variables de entorno de producción
- [ ] **4.5.3** Implementar monitoreo con Sentry o similar
- [ ] **4.5.4** Configurar logs centralizados
- [ ] **4.5.5** Crear dashboard de métricas (uptime, errores, performance)
- [ ] **4.5.6** Implementar alertas de errores críticos
- [ ] **4.5.7** Realizar pruebas de carga y estrés
- [ ] **4.5.8** Crear plan de rollback
- [ ] **4.5.9** Capacitar usuarios finales (admin, supervisores, empleados)
- [ ] **4.5.10** Realizar prueba piloto con usuarios reales
- [ ] **4.5.11** Ajustar según feedback de piloto
- [ ] **4.5.12** Preparar checklist de go-live
- [ ] **4.5.13** Realizar deployment a producción
- [ ] **4.5.14** Monitorear sistema 48 horas post-lanzamiento
- [ ] **4.5.15** Documentar lecciones aprendidas

---

## 📊 RESUMEN DE PROGRESO

### Estadísticas Generales

- **Total de tareas:** 188
- **Tareas completadas:** 27
- **Progreso general:** 14%

### Por Fase

- **FASE 0 - Estructura Base:** 14/35 (40%)
- **FASE 1 - Núcleo Operativo:** 13/58 (22%)
- **FASE 2 - Financiera:** 0/42 (0%)
- **FASE 3 - Operacional:** 0/28 (0%)
- **FASE 4 - Producción:** 0/25 (0%)

---

## 🎯 HITOS CRÍTICOS

### Hito 1: Sistema Base Funcional

**Objetivo:** Poder iniciar sesión, ver auditoría y configurar ubicaciones/procesos  
**Tareas:** 0.1 a 0.6 completas  
**Fecha estimada:** Semana 1-2

### Hito 2: Flujos Operativos Core

**Objetivo:** Poder registrar clientes, proveedores y producción  
**Tareas:** 1.1 a 1.4 completas  
**Fecha estimada:** Semana 3-5

### Hito 3: Compras y Ventas Operativas

**Objetivo:** Flujo completo de compra-venta con firmas digitales  
**Tareas:** 1.5 a 1.6 completas
