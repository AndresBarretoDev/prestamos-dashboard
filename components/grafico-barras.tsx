"use client"

import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { subMonths, format } from "date-fns"
import { es } from "date-fns/locale"

interface GraficoBarrasProps {
  prestamos: Prestamo[]
}

export function GraficoBarras({ prestamos }: GraficoBarrasProps) {
  // Generar datos para los últimos 6 meses basados en información real
  const ultimos6Meses = Array(6)
    .fill(0)
    .map((_, i) => {
      const fecha = subMonths(new Date(), i)
      return {
        fecha,
        mes: format(fecha, "MMM", { locale: es }),
        fechaInicio: format(fecha, "yyyy-MM-01"),
        fechaFin: format(fecha, "yyyy-MM-dd"),
      }
    })
    .reverse()

  // Analizar datos reales de préstamos para cada mes
  const data = ultimos6Meses.map((mes) => {
    // Préstamos iniciados en este mes
    const prestadoEnMes = prestamos
      .filter((p) => {
        const fechaInicio = new Date(p.fecha_inicio)
        return (
          fechaInicio.getMonth() === mes.fecha.getMonth() &&
          fechaInicio.getFullYear() === mes.fecha.getFullYear()
        )
      })
      .reduce((sum, p) => sum + p.monto, 0)

    // Pagos recibidos en este mes (estimación)
    const recuperadoEnMes = prestamos.reduce((sum, p) => {
      // Solo considerar préstamos activos o pagados
      if (p.estado === "vencido") return sum

      // Verificar si hay cuotas que correspondían a este mes
      const cuotasDelMes = p.tablaAmortizacion.filter((cuota) => {
        const fechaVencimiento = new Date(cuota.fecha_vencimiento)
        return (
          fechaVencimiento.getMonth() === mes.fecha.getMonth() &&
          fechaVencimiento.getFullYear() === mes.fecha.getFullYear() &&
          (cuota.estado === "pagada" ||
            (p.cuotasPagadas &&
              cuota.numero <= p.cuotasPagadas))
        )
      })

      return sum + cuotasDelMes.reduce((s, c) => s + c.valor, 0)
    }, 0)

    return {
      name: mes.mes,
      prestado: prestadoEnMes,
      recuperado: recuperadoEnMes,
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

  return (
    <div className="h-[300px] w-full">
      {prestamos.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formateadorValor} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar name="Prestado" dataKey="prestado" fill="#3b82f6" />
            <Bar name="Recuperado" dataKey="recuperado" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">No hay datos suficientes</div>
      )}
    </div>
  )
}
