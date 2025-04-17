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
            const fechaFormateada = cuota.fecha_vencimiento
              ? format(new Date(cuota.fecha_vencimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
              : "N/A";

            const getEstadoBadge = (estado: string) => {
              switch (estado) {
                case "pagada":
                  return <Badge className="bg-green-500">Pagada</Badge>;
                case "pendiente":
                  return <Badge className="bg-blue-500">Pendiente</Badge>;
                case "vencida":
                  return <Badge className="bg-red-500">Vencida</Badge>;
                default:
                  return <Badge>{estado}</Badge>;
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
  )
}
