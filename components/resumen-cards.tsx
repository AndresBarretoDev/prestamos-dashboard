import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { BanknoteIcon, CalendarIcon, CircleDollarSignIcon, AlertCircleIcon } from "lucide-react"

interface ResumenCardsProps {
  prestamos: Prestamo[]
}

export function ResumenCards({ prestamos }: ResumenCardsProps) {
  // Calcular totales
  const totalPrestado = prestamos.reduce((sum, p) => sum + p.monto, 0)

  const totalRecuperado = prestamos.reduce((sum, p) => {
    const cuotasPagadas = p.cuotasPagadas || 0
    return sum + p.cuota_mensual * cuotasPagadas
  }, 0)

  const prestamosActivos = prestamos.filter((p) => p.estado === "activo").length

  const totalMora = prestamos
    .filter((p) => p.estado === "vencido")
    .reduce((sum, p) => {
      const cuotasPendientes = p.cuotas - (p.cuotasPagadas || 0)
      return sum + p.cuota_mensual * cuotasPendientes
    }, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total prestado</CardTitle>
          <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPrestado)}</div>
          <p className="text-xs text-muted-foreground">Suma de todos los préstamos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total recuperado</CardTitle>
          <CircleDollarSignIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRecuperado)}</div>
          <p className="text-xs text-muted-foreground">Dinero recibido hasta la fecha</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Préstamos activos</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{prestamosActivos}</div>
          <p className="text-xs text-muted-foreground">Préstamos en curso</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total en mora</CardTitle>
          <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMora)}</div>
          <p className="text-xs text-muted-foreground">Dinero pendiente en préstamos vencidos</p>
        </CardContent>
      </Card>
    </div>
  )
}
