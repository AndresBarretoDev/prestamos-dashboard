"use client"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface GraficoCircularProps {
  prestamos: Prestamo[]
}

export function GraficoCircular({ prestamos }: GraficoCircularProps) {
  // Calcular datos para el gráfico
  const activos = prestamos.filter((p) => p.estado === "activo").reduce((sum, p) => sum + p.monto, 0)

  const pagados = prestamos.filter((p) => p.estado === "pagado").reduce((sum, p) => sum + p.monto, 0)

  const vencidos = prestamos.filter((p) => p.estado === "vencido").reduce((sum, p) => sum + p.monto, 0)

  const data = [
    { name: "Activos", value: activos },
    { name: "Pagados", value: pagados },
    { name: "Vencidos", value: vencidos },
  ].filter((item) => item.value > 0)

  const COLORS = ["#10b981", "#3b82f6", "#ef4444"]

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-[300px] w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">No hay datos suficientes</div>
      )}
    </div>
  )
}
