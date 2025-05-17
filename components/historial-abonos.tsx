"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AbonoCapital {
    id: string
    prestamo_id: string
    monto: number
    fecha_abono: string
    observaciones?: string
    tipo_recalculo: 'reducir_cuota' | 'reducir_plazo'
    creado_en: string
}

interface HistorialAbonosProps {
    abonos: AbonoCapital[]
}

export function HistorialAbonos({ abonos }: HistorialAbonosProps) {
    if (abonos.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                No hay abonos a capital registrados
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Tipo de recálculo</TableHead>
                        <TableHead>Observaciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {abonos.map((abono) => (
                        <TableRow key={abono.id}>
                            <TableCell>
                                {format(new Date(abono.fecha_abono), "PPP", { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatCurrency(abono.monto)}
                            </TableCell>
                            <TableCell>
                                {abono.tipo_recalculo === 'reducir_cuota'
                                    ? 'Reducir cuota'
                                    : 'Reducir plazo'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {abono.observaciones || '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 