"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface AbonoCapitalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    prestamo: Prestamo
    onConfirm: (data: {
        monto: number
        fecha_abono: string
        observaciones?: string
        tipo_recalculo: 'reducir_cuota' | 'reducir_plazo'
    }) => Promise<void>
}

export function AbonoCapitalDialog({
    open,
    onOpenChange,
    prestamo,
    onConfirm,
}: AbonoCapitalDialogProps) {
    const [monto, setMonto] = useState("")
    const [fechaAbono, setFechaAbono] = useState(new Date().toISOString().split("T")[0])
    const [observaciones, setObservaciones] = useState("")
    const [tipoRecalculo, setTipoRecalculo] = useState<'reducir_cuota' | 'reducir_plazo'>('reducir_cuota')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const saldoPendiente = prestamo.tablaAmortizacion
        .filter(cuota => cuota.estado === 'pendiente')
        .reduce((sum, cuota) => sum + cuota.valor, 0)

    const handleSubmit = async () => {
        try {
            setError(null)
            setIsSubmitting(true)

            const montoNumero = parseFloat(monto)
            if (isNaN(montoNumero) || montoNumero <= 0) {
                setError("Por favor ingrese un monto válido")
                return
            }

            if (montoNumero > saldoPendiente) {
                setError("El monto del abono no puede ser mayor al saldo pendiente")
                return
            }

            await onConfirm({
                monto: montoNumero,
                fecha_abono: fechaAbono,
                observaciones: observaciones || undefined,
                tipo_recalculo: tipoRecalculo
            })

            // Resetear el formulario
            setMonto("")
            setFechaAbono(new Date().toISOString().split("T")[0])
            setObservaciones("")
            setTipoRecalculo('reducir_cuota')
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al procesar el abono")
            console.error("Error en abono:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!isSubmitting) {
                setError(null)
                onOpenChange(newOpen)
            }
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Abono a Capital</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del abono a capital para el préstamo de {prestamo.deudor.nombre}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 border rounded-md">
                        <h3 className="font-medium mb-2">Información del préstamo</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <p className="text-sm">Saldo pendiente:</p>
                            <p className="text-sm font-medium">{formatCurrency(saldoPendiente)}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="monto">Monto del abono</Label>
                        <Input
                            id="monto"
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="Ingrese el monto"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha del abono</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={fechaAbono}
                            onChange={(e) => setFechaAbono(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <Textarea
                            id="observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Observaciones opcionales"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de recálculo</Label>
                        <RadioGroup
                            value={tipoRecalculo}
                            onValueChange={(value) => setTipoRecalculo(value as 'reducir_cuota' | 'reducir_plazo')}
                            className="flex flex-col space-y-1"
                            disabled={isSubmitting}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="reducir_cuota" id="reducir_cuota" disabled={isSubmitting} />
                                <Label htmlFor="reducir_cuota">Reducir el valor de la cuota</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="reducir_plazo" id="reducir_plazo" disabled={isSubmitting} />
                                <Label htmlFor="reducir_plazo">Reducir el plazo del préstamo</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Registrar abono'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 