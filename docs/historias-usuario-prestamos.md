# Historias de Usuario y Criterios de Aceptación (PO)

Alcance: Préstamos personales con amortización método francés. No se cambia UI; se definen reglas de negocio, aceptación y estado actual para alinear implementación y QA.

Roles

- Prestamista (admin)
- Deudor (cliente)

Estado guía: Cubierto | Parcial | Pendiente

---

## EPIC A · Creación y visualización

US-001 Crear préstamo (admin) — Estado: Cubierto

- Como prestamista quiero crear un préstamo (monto, tasa mensual, plazo, fecha inicio, deudor) para generar la tabla de amortización.
- Criterios
  - Validaciones obligatorias; tasa mensual en % (decimal internamente).
  - Cuota = P·r·(1+r)^n / ((1+r)^n−1), redondeada al peso.
  - Tabla con n cuotas; última ajusta capital para cierre exacto.
  - Persistir: `prestamos`, `cuotas`; RLS: solo admin puede crear.

US-002 Ver detalle del préstamo (admin/deudor) — Estado: Parcial

- Como usuario quiero ver la información del préstamo y la tabla de amortización.
- Criterios
  - Admin: ve métricas completas (capital pendiente real, ganancias).
  - Deudor: ve saldo pendiente total y su tabla; no ve métricas internas.
  - Las métricas se derivan de la tabla si el backend no las trae (computeLoanStats).

---

### EPIC B · Pagos de cuota

US-101 Pagar cuota exacta — Estado: Cubierto

- Como prestamista quiero marcar la cuota N como pagada con el valor exacto.
- Criterios
  - Rechazar `valor_pagado < cuota.valor`.
  - Persistir en `pagos` y actualizar `cuotas(N).estado='pagada'`.
  - No recálculo. Métricas actualizadas.

US-102 Pagar más sin registrar excedente — Estado: Parcial

- Como prestamista quiero registrar un pago mayor pero sin convertirlo en abono.
- Criterios
  - `pagos.valor_pagado > cuota.valor`. No se inserta en `abonos_capital`.
  - No recálculo. La fila muestra sólo “valor pagado”.

US-103 Pagar más registrando excedente (recalcula) — Estado: Pendiente

- Como prestamista quiero que el excedente se aplique al capital y recalcule el plan.
- Criterios
  - Insertar `pagos` y `abonos_capital` (observación “Excedente del pago de la cuota N”).
  - Ejecutar RPC transaccional: borrar cuotas no pagadas, renumerar desde `max(numero pagada)+1`, preservar fechas, ajustar última por redondeo.
  - Modos: reducir_cuota | reducir_plazo.
  - UI: fila N muestra “+ extra”; cuotas futuras y resúmenes cambian de inmediato.

US-104 Pagar cuota vencida — Estado: Parcial

- Como prestamista quiero poder pagar una cuota vencida y (opcional) registrar excedente.
- Criterios
  - Cambia a `pagada`; si hay excedente registrado, recálculo sólo afecta cuotas futuras.

---

### EPIC C · Abonos a capital (fuera del pago)

US-201 Registrar abono manual (recalcula) — Estado: Pendiente

- Como prestamista quiero registrar un abono directo al capital para reducir cuota o plazo.
- Criterios
  - Validar `monto <= capital_pendiente_real`; rechazar en caso contrario.
  - Ejecutar RPC transaccional (igual a US-103).
  - UI: no se marca ninguna cuota como pagada; la tabla se regenera.

US-202 Abono que liquida la deuda — Estado: Pendiente

- Como prestamista quiero que si el abono cubre el capital restante el préstamo quede liquidado.
- Criterios
  - RPC: no genera nuevas cuotas; cuando no quedan pendientes, estado `prestamos.estado='pagado'`.

---

### EPIC D · Edición de términos

US-301 Editar términos del préstamo — Estado: Parcial

- Como prestamista quiero modificar monto/tasa/plazo/fecha inicio manteniendo historial de pagos.
- Criterios
  - Regenerar sólo cuotas no pagadas; respetar pagadas y renumerar.
  - Última cuota ajusta redondeo.

---

### EPIC E · Integridad y consistencia

US-401 Sin duplicados de cuotas — Estado: Pendiente

- Como sistema quiero garantizar que no existan 2 cuotas con el mismo `(prestamo_id, numero)`.
- Criterios
  - Índice único activo.
  - RPC borra `estado <> 'pagada'` y renumera antes de insertar.

US-402 Métricas consistentes entre tabla y tarjetas — Estado: Pendiente

- Como usuario quiero que “cuotas pagadas/pendientes, saldo total y cuota” coincidan con la tabla.
- Criterios
  - Derivar métricas desde la tabla si falta actualización del backend.
  - Mostrar “+ extra” sólo en la fila de la cuota con excedente (observación “cuota N”).

US-403 Seguridad y RLS — Estado: Parcial

- Como sistema quiero ejecutar recálculos bajo RLS sin errores 409/23505.
- Criterios
  - RPC `SECURITY DEFINER` y transaccional.
  - Mensajes claros ante errores (cuota insuficiente para interés, abono > capital).

---

### EPIC F · QA y pruebas E2E

US-501 Verificación end‑to‑end — Estado: Pendiente

- Como equipo de QA quiero flujos en Playwright que validen escenarios críticos.
- Criterios
  - Crear→Pagar exacto→Excedente con recálculo (reducir_cuota)→Abono manual (reducir_plazo)→Liquidación.
  - Assert: sin duplicados, numeración consecutiva, fechas preservadas, última ajustada, métricas consistentes.

---

### Trazabilidad (referencias técnicas)

- Servicio: `lib/services/prestamos.ts` (markCuotaPagada, registrarAbonoCapital).
- RPC: `recalc_prestamo_after_abono` (Supabase) — transacción DELETE/INSERT + renumeración.
- UI: `app/prestamos/[id]/prestamo-detail.tsx`, `app/prestamo/[token]/public-prestamo-view.tsx`, `components/tabla-amortizacion.tsx`.
- Utilidades: `lib/utils/loan-stats.ts`, `lib/calculadora.ts`.
