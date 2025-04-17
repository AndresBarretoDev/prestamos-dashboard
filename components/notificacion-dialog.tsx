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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

interface NotificacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
}

export function NotificacionDialog({ open, onOpenChange, prestamo }: NotificacionDialogProps) {
  const [activado, setActivado] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [mensaje, setMensaje] = useState(
    `Hola ${prestamo.deudor.nombre}, te recordamos que mañana vence tu cuota mensual de ${formatCurrency(prestamo.cuota_mensual)} del préstamo con Préstamos. Gracias.`,
  )

  const handleGuardar = () => {
    if (activado) {
      setEnviado(true)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Recordatorio</DialogTitle>
          <DialogDescription>Configura recordatorios automáticos por WhatsApp para este préstamo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activar-notificacion">Activar recordatorio</Label>
              <p className="text-sm text-muted-foreground">Se enviará un mensaje 1 día antes del vencimiento</p>
            </div>
            <Switch id="activar-notificacion" checked={activado} onCheckedChange={setActivado} />
          </div>

          {activado && (
            <>
              <div className="space-y-2">
                <Label htmlFor="telefono">Número de teléfono</Label>
                <div className="flex items-center border rounded-md px-3 py-2 bg-muted">
                  <span>{prestamo.deudor.telefono}</span>
                  {enviado && <CheckIcon className="h-4 w-4 ml-2 text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Se usará el número registrado del deudor</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje personalizado</Label>
                <Textarea id="mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground">Puedes personalizar el mensaje que se enviará</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar configuración</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
