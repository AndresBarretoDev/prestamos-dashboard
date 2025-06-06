import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { Cuota } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TablaAmortizacionProps {
  cuotas: Cuota[]
  cuotasPagadas?: number
}

export function TablaAmortizacion({ cuotas, cuotasPagadas = 0 }: TablaAmortizacionProps) {
  return (
    <div className="space-y-4" data-tabla-amortizacion>
      <h3 className="text-xl font-semibold text-center">Tabla de Amortización</h3>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Cuota</TableHead>
              <TableHead>Fecha vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Valor cuota</TableHead>
              <TableHead className="text-right">Interés</TableHead>
              <TableHead className="text-right">Abono capital</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuotas.map((cuota) => {
              let fechaFormateada = "N/A";
              if (cuota.fecha_vencimiento) {
                const [year, month, day] = cuota.fecha_vencimiento.split('-').map(Number);
                const fecha = new Date(year, month - 1, day);
                fechaFormateada = format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
              }

              const getEstadoBadge = (estado: string) => {
                switch (estado) {
                  case "pagada":
                    return <Badge className="bg-green-500 text-white font-medium px-3 py-1 text-xs">Pagada</Badge>;
                  case "pendiente":
                    return <Badge className="bg-blue-500 text-white font-medium px-3 py-1 text-xs">Pendiente</Badge>;
                  case "vencida":
                    return <Badge className="bg-red-500 text-white font-medium px-3 py-1 text-xs">Vencida</Badge>;
                  default:
                    return <Badge className="bg-gray-500 text-white font-medium px-3 py-1 text-xs">{estado}</Badge>;
                }
              };

              return (
                <TableRow key={cuota.numero}>
                  <TableCell className="font-medium">{cuota.numero}</TableCell>
                  <TableCell>{fechaFormateada}</TableCell>
                  <TableCell>{getEstadoBadge(cuota.estado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cuota.valor)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cuota.interes)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cuota.abono_capital)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
