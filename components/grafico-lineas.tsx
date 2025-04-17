"use client"

import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface GraficoLineasProps {
  prestamos: Prestamo[]
}

export function GraficoLineas({ prestamos }: GraficoLineasProps) {
  // Generar datos para los últimos 12 meses
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Simulamos datos para el gráfico
  const data = meses.map((mes, index) => {
    // Valor inicial
    const valorInicial = prestamos.reduce((sum, p) => sum + p.monto, 0)

    // Simulamos una tendencia descendente (pagos)
    const factor = Math.max(0.5, 1 - index * 0.05)

    return {
      name: mes,
      saldo: Math.floor(valorInicial * factor),
    }
  })

  return (
    <div className="h-[300px] w-full">
      {prestamos.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
            <Line type="monotone" name="Saldo pendiente" dataKey="saldo" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">No hay datos suficientes</div>
      )}
    </div>
  )
}
