"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PrestamoForm } from "@/components/prestamo-form"
import type { Prestamo } from "@/lib/types"
import { createPrestamo } from "@/lib/services/prestamos"
import { useState } from "react"

interface NuevoPrestamoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (prestamo: Prestamo) => void
}

export function NuevoPrestamoDialog({ open, onOpenChange, onSave }: NuevoPrestamoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGuardarPrestamo = async (resultados: any) => {
    setIsSubmitting(true)

    try {
      // Los resultados ya incluyen los valores del formulario gracias a los cambios en PrestamoForm
      const {
        cuotaMensual,
        tablaAmortizacion,
        gananciaTotal,
        totalPagado,
        nombre,
        cedula,
        ciudad,
        telefono,
        monto,
        cuotas,
        tasa_mensual,
        fecha_inicio
      } = resultados;

      // Crear objeto de préstamo para enviar al servicio
      const nuevoPrestamo = await createPrestamo({
        nombre,
        cedula,
        ciudad,
        telefono,
        monto,
        tasa_mensual,
        cuotas,
        cuota_mensual: cuotaMensual,
        fecha_inicio: fecha_inicio, // Ya es un string yyyy-MM-dd
        tablaAmortizacion
      });

      if (nuevoPrestamo) {
        // Notificar al componente padre
        onSave(nuevoPrestamo);
        // Cerrar el diálogo
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving loan:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[80vw] xl:max-w-[60vw] max-h-[90vh] overflow-y-auto rounded-md border-0">
        <DialogHeader>
          <DialogTitle>Nuevo préstamo</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo préstamo y calcula la tabla de amortización.
          </DialogDescription>
        </DialogHeader>

        <PrestamoForm
          onSubmitSuccess={handleGuardarPrestamo}
        />
      </DialogContent>
    </Dialog>
  )
}
