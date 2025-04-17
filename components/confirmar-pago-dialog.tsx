"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Prestamo, Cuota } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { CheckCircleIcon } from "lucide-react"

interface ConfirmarPagoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
  proximaCuota: Cuota | null
  onConfirm: () => void
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
