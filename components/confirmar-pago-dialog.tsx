"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import type { Prestamo, Cuota } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { CheckCircleIcon, Loader2 } from "lucide-react"

interface ConfirmarPagoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
  proximaCuota: Cuota | null
  onConfirm: (valorPagado: number, registrarExcedente: boolean) => Promise<void>
}

export function ConfirmarPagoDialog({
  open,
  onOpenChange,
  prestamo,
  proximaCuota,
  onConfirm,
}: ConfirmarPagoDialogProps) {
  if (!proximaCuota) return null

  const numeroCuota = (prestamo.cuotasPagadas || 0) + 1
  const [montoPagar, setMontoPagar] = useState<number>(proximaCuota.valor)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [excedente, setExcedente] = useState<number>(0)
  const [registrarExcedente, setRegistrarExcedente] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular excedente cuando cambia el monto a pagar
  useEffect(() => {
    const valorCuota = proximaCuota.valor
    const diferencia = montoPagar - valorCuota

    setExcedente(diferencia > 0 ? diferencia : 0)

    // Si el excedente es muy pequeño, no ofrecer registrarlo
    if (diferencia < 100) {
      setRegistrarExcedente(false)
    }
  }, [montoPagar, proximaCuota])

  // Resetear el estado cuando se abre el diálogo
  useEffect(() => {
    if (open && proximaCuota) {
      setMontoPagar(proximaCuota.valor)
      setExcedente(0)
      setRegistrarExcedente(false)
      setError(null)
    }
  }, [open, proximaCuota])

  const handleMontoChange = (value: string) => {
    // Eliminar formato de moneda y convertir a número
    const numericValue = value.replace(/[^0-9]/g, '')
    if (numericValue) {
      setMontoPagar(Number(numericValue))
    } else {
      setMontoPagar(0)
    }
  }

  const handleConfirm = async () => {
    try {
      setError(null)
      setIsSubmitting(true)

      // Validar que el monto sea mayor que cero
      if (montoPagar <= 0) {
        setError("El monto a pagar debe ser mayor que cero")
        setIsSubmitting(false)
        return
      }

      // Validar que el monto sea al menos el valor de la cuota
      if (montoPagar < proximaCuota.valor) {
        setError(`El monto a pagar no puede ser menor que el valor de la cuota (${formatCurrency(proximaCuota.valor)})`)
        setIsSubmitting(false)
        return
      }

      await onConfirm(montoPagar, registrarExcedente && excedente > 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al procesar el pago")
      console.error("Error al confirmar pago:", err)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting) {
        onOpenChange(newOpen)
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pago de Cuota</DialogTitle>
          <DialogDescription>¿Estás seguro de que deseas marcar como pagada la cuota {numeroCuota}?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Detalles de la cuota</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm">Número de cuota:</p>
              <p className="text-sm font-medium">
                {numeroCuota} de {prestamo.cuotas}
              </p>

              <p className="text-sm">Valor de la cuota:</p>
              <p className="text-sm font-medium">{formatCurrency(proximaCuota.valor)}</p>

              <p className="text-sm">Interés:</p>
              <p className="text-sm font-medium">{formatCurrency(proximaCuota.interes)}</p>

              <p className="text-sm">Abono a capital:</p>
              <p className="text-sm font-medium">{formatCurrency(proximaCuota.abono_capital)}</p>

              <p className="text-sm">Fecha de vencimiento:</p>
              <p className="text-sm font-medium">{new Date(proximaCuota.fecha_vencimiento).toLocaleDateString()}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="montoPagar">Monto a pagar</Label>
            <Input
              id="montoPagar"
              type="text"
              value={formatCurrency(montoPagar)}
              onChange={(e) => handleMontoChange(e.target.value)}
              placeholder={`Valor de la cuota: ${formatCurrency(proximaCuota.valor)}`}
              disabled={isSubmitting}
              onFocus={(e) => e.target.select()}
            />
            <p className="text-xs text-gray-500">El monto debe ser al menos {formatCurrency(proximaCuota.valor)}</p>
          </div>

          {excedente > 100 && (
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                Estás pagando {formatCurrency(excedente)} más del valor de la cuota.
                ¿Deseas registrar este excedente como abono a capital?
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registrarExcedente"
                  checked={registrarExcedente}
                  onCheckedChange={(checked) => setRegistrarExcedente(checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="registrarExcedente">
                  Registrar el excedente como abono a capital
                </Label>
              </div>
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Confirmar pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
