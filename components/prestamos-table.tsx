"use client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EyeIcon } from "lucide-react"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface PrestamosTableProps {
  prestamos: Prestamo[]
}

export function PrestamosTable({ prestamos }: PrestamosTableProps) {
  const router = useRouter()

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>
      case "pagado":
        return <Badge className="bg-blue-500">Pagado</Badge>
      case "vencido":
        return <Badge className="bg-red-500">Vencido</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del deudor</TableHead>
            <TableHead>Monto prestado</TableHead>
            <TableHead>Cuota mensual</TableHead>
            <TableHead>Número total de cuotas</TableHead>
            <TableHead>Estado del préstamo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prestamos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No hay préstamos registrados
              </TableCell>
            </TableRow>
          ) : (
            prestamos.map((prestamo) => (
              <TableRow key={prestamo.id}>
                <TableCell className="font-medium">{prestamo.deudor.nombre}</TableCell>
                <TableCell>{formatCurrency(prestamo.monto)}</TableCell>
                <TableCell>{formatCurrency(prestamo.cuota_mensual)}</TableCell>
                <TableCell>{prestamo.cuotas}</TableCell>
                <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/prestamos/${prestamo.id}`)}>
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
