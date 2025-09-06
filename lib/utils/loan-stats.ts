import type { Prestamo, Cuota } from "../types"

export interface LoanStats {
    cuotasPagadas: number
    cuotasPendientes: number
    totalPagadoReal: number
    totalAbonosExtra: number
    interesesPagados: number
    capitalPagadoReal: number
    capitalPendienteReal: number
    interesesPendientesTeoricos: number
    saldoTotalPendienteTeorico: number
    gananciaTotalTeorica: number
    gananciaRealizada: number
}

function sum(values: number[]): number {
    return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)
}

export function computeLoanStats(prestamo: Prestamo): LoanStats {
    const cuotas = prestamo.tablaAmortizacion

    const cuotasPagadas = cuotas.filter(c => c.estado === 'pagada')
    const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente')

    // Pagos reales: si existe valor_pagado_real (inyectado desde servicios), usarlo; si no, usar valor de cuota
    const totalPagadoReal = sum(cuotasPagadas.map((c: any) => Number(c.valor_pagado_real || c.valor || 0)))

    // Abonos extra (inyectados por servicios en c.abono_adicional)
    const totalAbonosExtra = sum(cuotas.map((c: any) => Number(c.abono_adicional || 0)))

    // Intereses pagados (teóricos, provenientes de la tabla)
    const interesesPagados = sum(cuotasPagadas.map((c: Cuota) => c.interes))

    // Capital pagado real = totalPagadoReal - intereses de cuotas pagadas + abonos extra
    const capitalPagadoReal = totalPagadoReal - interesesPagados + totalAbonosExtra

    // Capital pendiente real = monto - capitalPagadoReal
    const capitalPendienteReal = Math.max(0, Math.round(prestamo.monto - capitalPagadoReal))

    // Intereses pendientes teóricos = suma de intereses de cuotas pendientes
    const interesesPendientesTeoricos = sum(cuotasPendientes.map((c: Cuota) => c.interes))

    // Saldo total pendiente teórico (lo que falta pagar si no hay más abonos) = suma de valores de cuotas pendientes
    const saldoTotalPendienteTeorico = sum(cuotasPendientes.map((c: Cuota) => c.valor))

    // Ganancia total teórica = suma de todos los intereses de la tabla
    const gananciaTotalTeorica = sum(cuotas.map((c: Cuota) => c.interes))

    // Ganancia realizada = intereses de cuotas pagadas
    const gananciaRealizada = interesesPagados

    return {
        cuotasPagadas: cuotasPagadas.length,
        cuotasPendientes: cuotasPendientes.length,
        totalPagadoReal,
        totalAbonosExtra,
        interesesPagados,
        capitalPagadoReal,
        capitalPendienteReal,
        interesesPendientesTeoricos,
        saldoTotalPendienteTeorico,
        gananciaTotalTeorica,
        gananciaRealizada
    }
}


