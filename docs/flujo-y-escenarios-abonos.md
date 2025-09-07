### Flujo y escenarios de pagos y abonos (método francés)

Esta guía define el comportamiento esperado de la plataforma ante pagos y abonos a capital, y las reglas de recálculo de la tabla de amortización.

#### Definiciones

- Cuota programada = capital + interés, con método francés.
- Pago real = valor efectivamente pagado por la cuota.
- Excedente = pago real − valor de la cuota (si > 0); se registra como abono a capital.
- Abono a capital = reducción directa del principal.

#### Métricas base (unificadas)

- capital_pagado_real = suma(pagos reales de cuotas pagadas) − suma(interés de cuotas pagadas) + suma(abonos extra)
- capital_pendiente_real = monto − capital_pagado_real
- intereses_pendientes_teoricos = suma(interés de cuotas no pagadas)
- saldo_pendiente_total = suma(valor de cuotas no pagadas)

#### Acciones

1) Marcar cuota como pagada (monto exacto)
   - Marca cuotaN como pagada.
   - Registra pagoN por `valor_pagado = cuota.valor`.
   - NO recalcúla tabla. Métricas se actualizan.

2) Marcar cuota como pagada con excedente
   - Marca cuotaN como pagada y registra pagoN (valor_pagado).
   - Registra excedente como abono a capital (abono_adicional) con observación "Excedente del pago de la cuota N".
   - Ejecuta recálculo (ver Reglas de recálculo) usando `capital_pendiente_real` y la opción elegida:
     a) Reducir cuota: mantener número de meses restantes; recalcular nueva cuota.
     b) Reducir plazo: mantener cuota; recalcular número de meses restantes (n') usando r en decimal.

3) Registrar abono a capital (independiente de pago)
   - Inserta abono por monto y fecha.
   - Ejecuta recálculo como en (2).

#### Reglas de recálculo (críticas)

1) Base de cálculo
   - principal_restante = capital_pendiente_real (no sumar cuotas programadas).
   - Si `principal_restante <= 0`, cerrar préstamo: no generar más cuotas.

2) Construcción de la nueva tabla
   - Identificar `max_numero_pagado` (máximo número de cuota con estado = 'pagada').
   - Eliminar TODAS las cuotas no pagadas: `DELETE FROM cuotas WHERE prestamo_id = $1 AND estado <> 'pagada'`.
   - Generar nueva tabla con numeración secuencial: `numero = max_numero_pagado + index + 1`.
   - Fechas de vencimiento:
     - Si hay fechas originales para posiciones remanentes, preservarlas en orden.
     - Si se reduce el plazo y faltan fechas, continuar mes a mes desde la última fecha disponible.
   - Intereses = saldo_anterior · r (decimal), redondeo a entero.
   - Última cuota: ajustar `abono_capital` para que la suma de abonos = principal_restante (cierre exacto por redondeo).

3) Modos
   - Reducir cuota: n = meses no pagados; calcular nueva cuota con método francés.
   - Reducir plazo: cuota = cuota actual; calcular n' con `n' = ceil( ln(C/(C−P*r)) / ln(1+r) )` (r decimal, C=cuota, P=principal_restante). Validar `C > P*r`.

4) Transaccionalidad
   - Operar en una transacción: insertar abono → actualizar préstamo (cuota/cuotas) → borrar cuotas no pagadas → insertar nuevas cuotas.
   - Evitar condiciones de carrera entre DELETE e INSERT.

5) Integridad
   - Índice único `cuotas(prestamo_id, numero)` — renumerar SIEMPRE a partir de `max_numero_pagado`.
   - No tocar cuotas pagadas; nunca reusar sus números.

#### Escenarios a validar (E2E)

1) Préstamo 5M @ 1.8% / 6m — pagar 1ra cuota exacta.
2) Pagar 2da cuota con excedente 1M — reducir cuota; verificar nuevas cuotas y fechas preservadas.
3) Abono directo 3M — reducir plazo; verificar n' y cierre exacto en última cuota.
4) Edge: excedente casi igual al principal restante — n' = 1 con ajuste final.
5) Concurrencia: dos abonos en ventana corta — transacción garantiza consistencia.

#### UI (resumen)

- Deudor: mostrar saldo pendiente total y tabla con pagos reales/abonos extra.
- Prestamista: además, capital pendiente real y ganancia realizada/teórica.

---

### Contrato Frontend ↔ Backend

- Registrar abono a capital
  - Entrada: `prestamo_id (uuid)`, `monto (int)`, `fecha_abono (date|timestamptz)`, `tipo_recalculo ('reducir_cuota'|'reducir_plazo')`, `observaciones (opcional)`
  - Llamada: `rpc('recalc_prestamo_after_abono', { p_prestamo, p_monto, p_fecha, p_tipo })`
  - Salida esperada: 200 OK (sin payload) y luego `getPrestamo(id)` para refrescar el estado.

- Marcar cuota como pagada
  - Entrada: `prestamo_id (uuid)`, `numero (int)`, `valor_pagado (int)`, `registrarExcedente (bool)`
  - Si hay excedente y `registrarExcedente=true`, se debe invocar internamente el mismo flujo de recálculo que el abono (RPC).

- Lectura de datos
  - La tabla que se renderiza siempre es `prestamo.tablaAmortizacion` con campos derivados opcionales: `valor_pagado_real`, `abono_adicional` (solo cuando es excedente de esa cuota), `total_pagado`.
  - Los resúmenes (cuotas pagadas/pendientes, saldo total, capital pendiente) se derivan con `computeLoanStats` si el backend aún no actualiza `prestamo.cuotas`/`prestamo.cuota_mensual` en el mismo response.

### Reglas de mapeo en UI (para evitar duplicidades)

- Mostrar “+ extra” en la fila solo si existe `abono_adicional` vinculado a esa misma cuota (excedente del pago de esa cuota, no abonos manuales globales).
- Los abonos manuales se listan en un panel/historial aparte; no deben sumarse en múltiples filas.
- “Cuotas pagadas” y “pendientes” se calculan desde la tabla (no de `prestamo.cuotas`).
- “Cuota mensual” que se muestra corresponde a `prestamo.cuota_mensual` recalculada; si falta, derive con la primera cuota pendiente.

### RPC transaccional (resumen de comportamiento)

- SECURITY DEFINER + RLS compatibles.
- Pasos atómicos:
  1) Insertar el abono en `abonos_capital`.
  2) Calcular `capital_pendiente_real` (pagos reales + intereses pagados + abonos extra acumulados).
  3) Borrar todas las cuotas `estado <> 'pagada'` del préstamo.
  4) Generar nuevas cuotas: numeración `max(numero pagada) + index + 1`, preservar fechas cuando existan; última cuota ajusta redondeo.
  5) Actualizar `prestamos.cuota_mensual` y `prestamos.cuotas`.

### Casos límite y decisiones

- Abono que deja el capital en 0: no se generan nuevas cuotas, estado final “pagado” cuando todas las cuotas estén marcadas.
- Reducir plazo con cuota insuficiente (`cuota <= principal*r`): abortar con error legible.
- Concurrencia: si dos abonos llegan casi a la vez, la transacción garantiza que no haya números duplicados.

### Checklist de QA (mínimo)

1) Crear préstamo de 1M @1.8%/6
2) Pagar cuota 1 exacta
3) Pagar cuota 2 con excedente de 800k (reducir_cuota)
   - Verificar: nuevas cuotas con valor menor; fechas preservadas; numeración consecutiva
4) Registrar abono directo de 300k (reducir_plazo)
   - Verificar: menos cuotas pendientes; última cuota ajustada
5) Vista deudor
   - Solo saldo total y “+ extra” por excedente en su propia fila
6) Vista prestamista
   - Capital pendiente real y ganancias correctas
7) Sin duplicados en `cuotas(prestamo_id, numero)`

### Errores comunes y cómo evitarlos

- 23505 en `cuotas_prestamo_numero_unique`: siempre borrar `estado <> 'pagada'` y renumerar desde `max(numero pagada)+1` en una transacción.
- Abonos “duplicados” en filas: no asociar por fecha; usar observación “Excedente del pago de la cuota N”.
- Resúmenes inconsistentes: derivar métricas de la tabla con `computeLoanStats` cuando el backend aún no propagó cambios.

---

## Backlog de tareas (pendientes por implementar/validar)

Estado general actual (observado):

- El recálculo tras abono falla en ciertos préstamos (error 23505) → Pendiente.
- La UI muestra “extra” duplicado y resúmenes inconsistentes → Pendiente.
- Marcar cuota con excedente no dispara recálculo visible → Pendiente.

### A) Backend – Supabase/RPC (Pendiente)

- [ ] Convertir `recalc_prestamo_after_abono` a SECURITY DEFINER (compatible RLS) y `search_path` seguro.
- [ ] Transacción atómica: insertar abono → borrar `cuotas` con `estado <> 'pagada'` → renumerar nuevas desde `max(numero pagada)+1` → actualizar `prestamos`.
- [ ] Preservar fechas originales de cuotas remanentes; si se reduce plazo, continuar meses desde la última fecha disponible.
- [ ] Ajustar última cuota para cierre exacto por redondeo.
- [ ] Bloquear abonos mayores al capital pendiente (mensaje claro).
- [ ] Cierre automático: si capital restante = 0, no generar nuevas cuotas y marcar préstamo “pagado” cuando no queden pendientes.
- [ ] `markCuotaPagada` con excedente: invocar RPC de recálculo cuando `registrarExcedente = true`.

### B) Frontend – UI/UX (Pendiente)

- [ ] Botones: aclarar comportamientos (“Marcar cuota como pagada” vs “Registrar abono a capital”) en textos del diálogo.
- [ ] “Marcar cuota como pagada” con excedente: mostrar confirmación del abono y reflejar recálculo en la tabla.
- [ ] “Registrar abono a capital”: usar RPC y mostrar feedback (éxito/error) sin ambigüedad.
- [ ] Tabla: mostrar “+ extra” solo cuando sea excedente de esa cuota pagada; abonos manuales van al historial, no en filas múltiples.
- [ ] Resúmenes: calcular “Cuotas pagadas/pendientes” desde la tabla; “Cuota mensual/Total a pagar” desde préstamo recalculado o `computeLoanStats` como fallback.
- [ ] Vista de deudor: mostrar solo saldo pendiente total; ocultar capital interno.
- [ ] Vista de prestamista: además capital pendiente real y ganancia realizada/teórica.
- [ ] Estado “pagado”: cuando no haya cuotas pendientes tras recálculo/refresco.

### C) QA/E2E – Playwright (Pendiente)

- [ ] Crear préstamo 1M @1.8%/6 → validar cuota y tabla.
- [ ] Pagar 1ra cuota exacta → sin recálculo; métricas se actualizan.
- [ ] Pagar 2da con excedente 800k (reducir_cuota) → baja cuota; fechas preservadas; numeración correcta.
- [ ] Registrar abono directo 300k (reducir_plazo) → menos cuotas; última ajustada.
- [ ] Edge: abono que liquida la deuda → sin nuevas cuotas; estado final consistente.
- [ ] Múltiples abonos/pagos mismo día → sin “extra” duplicado (vínculo por observación “cuota N”).
- [ ] Sin duplicados en `cuotas(prestamo_id, numero)` tras cada recálculo.

### D) Incidencias actuales a corregir (Pendiente)

- [ ] Error 23505 al registrar abono (índice único) en préstamos con cuotas no pagadas.
- [ ] “+ extra” se repite en filas/periodos donde no corresponde.
- [ ] Resúmenes vs tabla: “2 de 2” cuando existen pendientes; “Cuota mensual $0” con valores en tabla.
- [ ] Sin recálculo visible tras excedente al marcar cuota como pagada.

---

## Criterios de aceptación por escenario

Formato (para todos los escenarios):
- Precondiciones
- Acción del usuario
- Resultado en BD (Supabase)
- Resultado en UI (deudor y prestamista)
- Reglas/Observaciones

### 1) Pago de cuota exacta
- Precondiciones: préstamo activo con cuota N en estado `pendiente`.
- Acción: “Marcar cuota como pagada” con `valor_pagado = cuota.valor`.
- BD: `cuotas(N).estado = 'pagada'`, `pagos` inserta registro por el valor exacto; no cambia `prestamos.cuota_mensual` ni `prestamos.cuotas`.
- UI: fila N se muestra “Pagada”; métricas (cuotas pagadas, total pagado, capital/interés pagados) aumentan; no hay recálculo de futuras cuotas.
- Observaciones: no hay excedente, no se registran abonos.

### 2) Pago menor al valor de la cuota (rechazado)
- Precondiciones: cuota N `pendiente`.
- Acción: “Marcar cuota como pagada” con `valor_pagado < cuota.valor`.
- BD: sin cambios.
- UI: se muestra error “El monto pagado no puede ser menor al valor de la cuota”.
- Observaciones: no se permiten pagos parciales.

### 3) Pago mayor sin registrar excedente
- Precondiciones: cuota N `pendiente`.
- Acción: “Marcar cuota como pagada” con `valor_pagado > cuota.valor` y desmarcado “Registrar excedente”.
- BD: `cuotas(N).estado = 'pagada'`; `pagos` registra `valor_pagado`; NO se inserta en `abonos_capital`; NO cambia `prestamos` ni futuras cuotas.
- UI: fila N “Pagada” con “Valor pagado” > “Valor programado”; no se muestra “+ extra” (excedente no registrado); sin recálculo de la tabla.
- Observaciones: el exceso no reduce capital pendiente.

### 4) Pago mayor registrando excedente (recalcula)
- Precondiciones: cuota N `pendiente`.
- Acción: “Marcar cuota como pagada” con `valor_pagado > cuota.valor` y activado “Registrar excedente”.
- BD: `pagos` registra `valor_pagado`; se inserta `abonos_capital` con observación “Excedente del pago de la cuota N”; se ejecuta RPC de recálculo.
- UI (deudor): fila N muestra “Valor pagado” y “+ extra”; las cuotas posteriores se actualizan (según modo elegido); resúmenes actualizados.
- UI (prestamista): se refleja nueva `cuota_mensual` o nuevo `n` y capital pendiente real actualizado.
- Observaciones: el recálculo respeta cuotas pagadas, renumera desde `max(numero pagada) + 1`, preserva fechas cuando aplica y ajusta la última por redondeo.

### 5) Abono a capital “manual” (sin pago de cuota)
- Precondiciones: préstamo activo con cuotas futuras.
- Acción: “Registrar abono a capital” con `monto` y `tipo_recalculo`.
- BD: inserta en `abonos_capital` y se ejecuta RPC de recálculo; se regeneran cuotas no pagadas.
- UI: la tabla cambia según el tipo (reduce cuota o reduce plazo); resúmenes se actualizan.
- Observaciones: no se marca ninguna cuota como pagada.

### 6) Abono que liquida la deuda
- Precondiciones: capital restante <= abono solicitado.
- Acción: abono (excedente o manual) con `monto >= capital_pendiente_real`.
- BD: tras RPC, no se generan nuevas cuotas; cuando no queden `pendiente`, `prestamos.estado = 'pagado'`.
- UI: sin cuotas pendientes; estado del préstamo “Pagado”.
- Observaciones: validar límite y feedback claro al usuario.

### 7) Pago de cuota “vencida”
- Precondiciones: cuota N `vencida`.
- Acción: “Marcar cuota como pagada” (con o sin excedente).
- BD: cambia `estado` a `pagada`; si hay excedente y se registra, se ejecuta recálculo; cuotas anteriores NO se tocan.
- UI: fila N pasa a “Pagada”; si hubo excedente registrado, tabla refleja recálculo en futuras cuotas.
- Observaciones: el recálculo solo afecta cuotas no pagadas posteriores.

### 8) Abono superior al capital pendiente (rechazado)
- Precondiciones: capital_pendiente_real calculable.
- Acción: abono (manual o excedente) con `monto > capital_pendiente_real`.
- BD: sin cambios.
- UI: error “El monto del abono excede el capital pendiente del préstamo”.
- Observaciones: bloquear antes de invocar RPC.

### 9) Varios abonos/pagos en la misma fecha
- Precondiciones: más de un evento en la misma fecha.
- Acción: pagos y abonos el mismo día.
- BD: cada excedente se inserta con observación “Excedente del pago de la cuota N”; abonos manuales con su propia observación.
- UI: “+ extra” solo en la fila de la cuota N correspondiente; abonos manuales aparecen en el historial, no en filas múltiples.
- Observaciones: evitar asociación por fecha; usar observación con número de cuota.

### 10) Edición de términos (monto/tasa/plazo/fecha inicio)
- Precondiciones: préstamo activo.
- Acción: “Editar préstamo” y guardar cambios.
- BD: se actualiza `prestamos`; se regeneran cuotas no pagadas preservando `pagadas` y renumerando.
- UI: la tabla se regenera acorde a los nuevos términos; resúmenes consistentes.
- Observaciones: última cuota ajusta redondeo; validar que la cuota resultante sea viable.

### 11) Resultado esperado tras cualquier recálculo
- Precondiciones: se ejecutó RPC.
- Acción: refrescar datos del préstamo.
- BD: sin duplicados en `cuotas(prestamo_id, numero)`; cuotas `pagadas` intactas.
- UI: numeración consecutiva, fechas preservadas cuando corresponde, última cuota ajustada; métricas y resúmenes consistentes.
- Observaciones: debe ser idempotente ante múltiples recálculos en poco tiempo.
