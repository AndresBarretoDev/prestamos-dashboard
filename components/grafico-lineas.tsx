"use client"

import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { addMonths, subMonths, format, isAfter, isBefore, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"

interface GraficoLineasProps {
  prestamos: Prestamo[]
}

export function GraficoLineas({ prestamos }: GraficoLineasProps) {
  // Generar datos para los últimos 12 meses y proyección a futuro (total 24 meses)
  const mesesAnalisis = Array(24)
    .fill(0)
    .map((_, i) => {
      // Empezamos 12 meses atrás, y hasta 12 meses adelante
      const fecha = subMonths(new Date(), 12 - i)
      return {
        fecha,
        mes: format(fecha, "MMM yy", { locale: es }),
        esProyeccion: isAfter(fecha, new Date()),
      }
    })

  // Función para calcular el saldo pendiente en una fecha específica
  const calcularSaldoPendienteEnFecha = (fecha: Date, prestamo: Prestamo): number => {
    // Si el préstamo inició después de la fecha, no había saldo pendiente
    if (isBefore(fecha, new Date(prestamo.fecha_inicio))) {
      return 0
    }

    // Si el préstamo está pagado, no hay saldo pendiente
    if (prestamo.estado === "pagado") {
      return 0
    }

    // Calcular cuotas pagadas hasta la fecha
    const cuotasPagadas = prestamo.cuotasPagadas || 0

    // Para fechas futuras, calculamos el saldo proyectado
    const hoy = new Date()
    let cuotasProyectadas = cuotasPagadas

    // Si la fecha es posterior a hoy, proyectamos pagos adicionales
    if (isAfter(fecha, hoy)) {
      // Calculamos cuántos meses adicionales de pagos proyectados
      let fechaTemp = startOfMonth(hoy)
      while (isBefore(fechaTemp, fecha) && cuotasProyectadas < prestamo.cuotas) {
        cuotasProyectadas++
        fechaTemp = addMonths(fechaTemp, 1)
      }
    }

    // Capital ya pagado
    const capitalPagado = prestamo.tablaAmortizacion
      .slice(0, cuotasProyectadas)
      .reduce((sum, cuota) => sum + cuota.abono_capital, 0)

    // Saldo pendiente
    return Math.max(0, prestamo.monto - capitalPagado)
  }

  // Analizar los datos para cada mes
  const data = mesesAnalisis.map((mes) => {
    // Calcular saldo total pendiente para este mes
    const saldoPendiente = prestamos.reduce(
      (sum, prestamo) => sum + calcularSaldoPendienteEnFecha(mes.fecha, prestamo),
      0
    )

    return {
      name: mes.mes,
      saldo: saldoPendiente,
      esProyeccion: mes.esProyeccion,
    }
  })

  // Formateador personalizado para valores monetarios en el gráfico
  const formateadorValor = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return formatCurrency(value)
  }

  // Dividir datos entre históricos y proyectados
  const datosHistoricos = data.filter(d => !d.esProyeccion)
  const datosProyectados = data.filter(d => d.esProyeccion)

  return (
    <div className="h-[300px] w-full">
      {prestamos.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              allowDuplicatedCategory={false}
            />
            <YAxis tickFormatter={formateadorValor} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Periodo: ${label}`}
            />
            <Legend />

            {/* Datos históricos (línea sólida) */}
            <Line
              data={datosHistoricos}
              type="monotone"
              name="Histórico"
              dataKey="saldo"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />

            {/* Datos proyectados (línea punteada) */}
            <Line
              data={datosProyectados}
              type="monotone"
              name="Proyección"
              dataKey="saldo"
              stroke="#82ca9d"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">No hay datos suficientes</div>
      )}
    </div>
  )
}
