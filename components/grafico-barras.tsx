"use client"

import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface GraficoBarrasProps {
  prestamos: Prestamo[]
}

export function GraficoBarras({ prestamos }: GraficoBarrasProps) {
  // Generar datos para los últimos 6 meses
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]

  // Simulamos datos para el gráfico
  const data = meses.map((mes, index) => {
    // Valores simulados basados en los préstamos existentes
    const prestado = Math.floor(
      (prestamos.reduce((sum, p) => sum + p.monto, 0) / 6) * (1 + Math.random() * 0.5),
    )

    const recuperado = Math.floor(prestamos.reduce((sum, p) => sum + p.cuota_mensual, 0) * (1 + Math.random() * 0.5))

    return {
      name: mes,
      prestado,
      recuperado,
    }
  })

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
            <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
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
