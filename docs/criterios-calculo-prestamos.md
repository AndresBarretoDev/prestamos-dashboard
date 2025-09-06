### Criterios de cálculo y definiciones (método francés)

- **Cuota mensual**: P · r · (1+r)^n / ((1+r)^n − 1)
  - P: monto, r: tasa mensual decimal, n: meses
  - Se redondea al peso; la última cuota ajusta redondeos de capital

- **Tabla de amortización (cada cuota)**
  - valor = cuota mensual (programado)
  - interés = saldo_anterior · r (redondeado)
  - abono_capital = valor − interés (redondeado)
  - La suma de abonos_capital = monto (se ajusta en la última cuota)

- **Pagos reales** (si existen)
  - valor_pagado_real: monto efectivamente pagado para esa cuota
  - abono_adicional: excedente pagado el mismo día (abono extra a capital)
  - total_pagado = valor_pagado_real + abono_adicional

### Métricas unificadas (computeLoanStats)

- **Total pagado real**: suma de valor_pagado_real de cuotas pagadas
- **Abonos extra**: suma de abono_adicional
- **Intereses pagados (realizados)**: suma de interés de cuotas pagadas
- **Capital pagado real**: total_pagado_real − intereses_pagados + abonos_extra
- **Capital pendiente real**: monto − capital_pagado_real
- **Intereses pendientes (teóricos)**: suma de interés de cuotas pendientes
- **Saldo pendiente (total)**: suma de valor de cuotas pendientes (capital + intereses)
- **Ganancia total teórica**: suma de todos los intereses de la tabla
- **Ganancia realizada**: intereses_pagados

### Reglas de recálculo por abonos a capital

- Se calcula sobre capital pendiente real
- Opción "reducir_cuota": mantener plazo; recalcular cuota
- Opción "reducir_plazo": mantener cuota; recalcular n (usa tasa en decimal)
- Se preservan fechas/números de cuotas; la última ajusta redondeos

### Visibilidad por perfil

- **Deudor (público)**
  - Muestra: saldo pendiente (total por pagar), total pagado, abonos extra, tabla con pagos reales
  - Oculta: capital pendiente y métricas internas del prestamista

- **Prestamista (admin)**
  - Muestra además: capital pendiente real, ganancia realizada/teórica

### Consistencia de datos

- Índice único: cuotas(prestamo_id, numero) para evitar duplicados
- Limpieza de duplicados histórica ejecutada
- El servicio preserva: valor_pagado_real, abono_adicional, total_pagado

### Ejemplo 17,000,000 COP, 1.8% mensual, 12 meses

- Cuota mensual ≈ 1,587,834
- Con 3 cuotas pagadas y abonos extra registrados:
  - capital_pagado_real ≈ 3.94M
  - capital_pendiente_real ≈ 13.06M
  - saldo_pendiente (total cuotas) ≈ 14.29M (incluye intereses futuros)


