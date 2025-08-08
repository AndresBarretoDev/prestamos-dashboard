import type { Cuota } from "./types"
import { addMonths, format } from "date-fns"

export function calcularCuotaMensual(monto: number, tasaInteresMensual: number, plazoMeses: number): number {
  // Convertir tasa de interés de porcentaje a decimal
  const tasaDecimal = tasaInteresMensual / 100

  // Fórmula de cuota fija: P * r * (1+r)^n / ((1+r)^n - 1)
  // Donde P es el monto del préstamo, r es la tasa de interés, y n es el plazo
  const numerador = monto * tasaDecimal * Math.pow(1 + tasaDecimal, plazoMeses)
  const denominador = Math.pow(1 + tasaDecimal, plazoMeses) - 1

  // Calcular cuota mensual
  const cuotaMensual = numerador / denominador

  // Redondear al entero más cercano
  return Math.round(cuotaMensual)
}

export function calcularTablaAmortizacion(
  monto: number,
  tasaInteresMensual: number,
  plazoMeses: number,
  cuotaMensual: number,
  fechaInicio: string
): Cuota[] {
  // Convertir tasa de interés de porcentaje a decimal
  const tasaDecimal = tasaInteresMensual / 100

  // Inicializar tabla de amortización
  const tabla: Cuota[] = []

  // Saldo inicial
  let saldoRestante = monto

  // Crear fecha de inicio como fecha local (no UTC) para evitar problemas de zona horaria
  // Parseamos manualmente la fecha en formato yyyy-MM-dd para mantener el día exacto
  const [year, month, day] = fechaInicio.split('-').map(Number)
  const fechaInicioDate = new Date(year, month - 1, day) // month - 1 porque Date usa índices basados en 0 para meses

  // Calcular cada cuota
  for (let numero = 1; numero <= plazoMeses; numero++) {
    // Calcular interés para este mes
    const interesMes = saldoRestante * tasaDecimal

    // Calcular abono a capital
    const abonoCapital = cuotaMensual - interesMes

    // Actualizar saldo restante
    saldoRestante -= abonoCapital

    // Asegurar que el saldo no sea negativo en la última cuota
    if (numero === plazoMeses) {
      saldoRestante = 0
    }

    // Calcular fecha de vencimiento sumando meses a la fecha de inicio
    const fechaVencimiento = addMonths(fechaInicioDate, numero)

    // Agregar cuota a la tabla
    tabla.push({
      prestamo_id: "", // Se asignará después
      numero,
      fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
      valor: cuotaMensual,
      interes: Math.round(interesMes),
      abono_capital: Math.round(abonoCapital),
      estado: "pendiente"
    })
  }

  return tabla
}

export function calcularGananciaTotal(tabla: Cuota[]): number {
  // La ganancia total es la suma de todos los intereses pagados
  return tabla.reduce((total, cuota) => total + cuota.interes, 0)
}

export function calcularTotalPagado(montoPrestado: number, tabla: Cuota[]): number {
  // El total pagado es el monto prestado más la ganancia total
  const gananciaTotal = calcularGananciaTotal(tabla)
  return montoPrestado + gananciaTotal
}
