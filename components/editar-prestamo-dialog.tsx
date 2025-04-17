"use client"

import type React from "react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaAmortizacion } from "@/components/tabla-amortizacion"
import type { Prestamo, Cuota } from "@/lib/types"
import {
  calcularCuotaMensual,
  calcularTablaAmortizacion,
  calcularGananciaTotal,
  calcularTotalPagado,
} from "@/lib/calculadora"
import { formatCurrency } from "@/lib/utils"
import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { prestamoEditSchema } from "@/lib/schemas/prestamoSchema"

interface EditarPrestamoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamo: Prestamo
  onSave: (prestamo: Prestamo) => void
}

export function EditarPrestamoDialog({ open, onOpenChange, prestamo, onSave }: EditarPrestamoDialogProps) {
  const [activeTab, setActiveTab] = useState("datos")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Configurar react-hook-form con validación de Zod
  const form = useForm({
    resolver: zodResolver(prestamoEditSchema),
    defaultValues: {
      monto: prestamo.monto,
      cuotas: prestamo.cuotas,
      tasa_mensual: prestamo.tasa_mensual,
      fecha_inicio: prestamo.fecha_inicio,
    },
  })

  const { register, watch, trigger, getValues, formState } = form;
  const [cuota_mensual, setCuotaMensual] = useState(prestamo.cuota_mensual)
  const [tablaAmortizacion, setTablaAmortizacion] = useState<Cuota[]>(prestamo.tablaAmortizacion)
  const [gananciaTotal, setGananciaTotal] = useState(prestamo.gananciaTotal || 0)
  const [totalPagado, setTotalPagado] = useState(prestamo.totalPagado || 0)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (open) {
      // Resetear formulario cuando se abre el diálogo
      form.reset({
        monto: prestamo.monto,
        cuotas: prestamo.cuotas,
        tasa_mensual: prestamo.tasa_mensual,
        fecha_inicio: prestamo.fecha_inicio,
      })
      setCuotaMensual(prestamo.cuota_mensual)
      setTablaAmortizacion(prestamo.tablaAmortizacion)
      setGananciaTotal(prestamo.gananciaTotal || 0)
      setTotalPagado(prestamo.totalPagado || 0)
      setActiveTab("datos")
      setShowAlert(false)
    }
  }, [open, prestamo, form])

  const recalcularPrestamo = () => {
    // Validar los datos primero
    form.trigger();

    // Si hay errores, no continuar
    if (!form.formState.isValid) {
      return;
    }

    const values = form.getValues();
    const { monto, cuotas, tasa_mensual, fecha_inicio } = values;

    // Calcular cuota mensual
    const cuota = calcularCuotaMensual(monto, tasa_mensual, cuotas)
    setCuotaMensual(cuota)

    // Generar tabla de amortización
    const tabla = calcularTablaAmortizacion(monto, tasa_mensual, cuotas, cuota, fecha_inicio)
    setTablaAmortizacion(tabla)

    // Calcular ganancia total y total pagado
    const ganancia = calcularGananciaTotal(tabla)
    setGananciaTotal(ganancia)

    const total = calcularTotalPagado(monto, tabla)
    setTotalPagado(total)

    // Cambiar a la pestaña de resultados
    setActiveTab("resultados")
    setShowAlert(true)
  }

  const guardarCambios = async () => {
    // Validar los datos primero
    const valid = await form.trigger();
    if (!valid) return;

    setIsSubmitting(true);

    try {
      const values = form.getValues();

      // Crear objeto de préstamo actualizado
      const prestamoActualizado: Prestamo = {
        ...prestamo,
        monto: values.monto,
        cuotas: values.cuotas,
        tasa_mensual: values.tasa_mensual,
        fecha_inicio: values.fecha_inicio,
        cuota_mensual: calcularCuotaMensual(values.monto, values.tasa_mensual, values.cuotas),
        tablaAmortizacion,
        gananciaTotal,
        totalPagado,
        // Resetear cuotas pagadas si se cambia el plazo
        cuotasPagadas: values.cuotas !== prestamo.cuotas ? 0 : prestamo.cuotasPagadas,
      }

      // Guardar préstamo
      onSave(prestamoActualizado)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[80vw] xl:max-w-[60vw] max-h-[90vh] overflow-y-auto rounded-md border-0">
        <DialogHeader>
          <DialogTitle>Editar Préstamo</DialogTitle>
          <DialogDescription>Modifica los datos del préstamo y recalcula la tabla de amortización.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="datos">Datos del Préstamo</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto del préstamo ($)</Label>
                <Input
                  id="monto"
                  type="number"
                  {...register("monto", { valueAsNumber: true })}
                  required
                />
                {formState.errors.monto && (
                  <p className="text-sm text-red-500">{formState.errors.monto.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuotas">Plazo en meses</Label>
                <Input
                  id="cuotas"
                  type="number"
                  {...register("cuotas", { valueAsNumber: true })}
                  required
                />
                {formState.errors.cuotas && (
                  <p className="text-sm text-red-500">{formState.errors.cuotas.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasa_mensual">Tasa de interés mensual (%)</Label>
                <Input
                  id="tasa_mensual"
                  type="number"
                  step="0.01"
                  {...register("tasa_mensual", { valueAsNumber: true })}
                  required
                />
                {formState.errors.tasa_mensual && (
                  <p className="text-sm text-red-500">{formState.errors.tasa_mensual.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...register("fecha_inicio")}
                  required
                />
                {formState.errors.fecha_inicio && (
                  <p className="text-sm text-red-500">{formState.errors.fecha_inicio.message}</p>
                )}
              </div>
            </div>

            <Button
              onClick={recalcularPrestamo}
              className="w-full mt-4"
              disabled={!formState.isValid || watch("monto") <= 0 || watch("cuotas") <= 0}
            >
              Recalcular préstamo
            </Button>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4 py-4">
            {showAlert && (
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>
                  Has modificado los términos del préstamo. Al guardar, se actualizará la tabla de amortización.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Detalles actualizados</h3>
                <p>Monto: {formatCurrency(watch("monto"))}</p>
                <p>Plazo: {watch("cuotas")} meses</p>
                <p>Tasa: {watch("tasa_mensual")}% mensual</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Nueva cuota mensual</h3>
                  <p className="text-xl font-bold">{formatCurrency(cuota_mensual)}</p>
                  <p className="text-sm text-muted-foreground">Anterior: {formatCurrency(prestamo.cuota_mensual)}</p>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Ganancia total</h3>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(gananciaTotal)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Anterior: {formatCurrency(prestamo.gananciaTotal || 0)}
                  </p>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Total a pagar</h3>
                  <p className="text-xl font-bold">{formatCurrency(totalPagado)}</p>
                  <p className="text-sm text-muted-foreground">Anterior: {formatCurrency(prestamo.totalPagado || 0)}</p>
                </div>
              </div>

              <h3 className="font-medium">Nueva tabla de amortización</h3>
              <div className="border rounded-md overflow-hidden">
                <TablaAmortizacion cuotas={tablaAmortizacion} cuotasPagadas={0} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardarCambios} disabled={activeTab === "datos" || isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
