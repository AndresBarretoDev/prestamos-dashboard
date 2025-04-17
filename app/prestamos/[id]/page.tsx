"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TablaAmortizacion } from "@/components/tabla-amortizacion"
import { EditarPrestamoDialog } from "@/components/editar-prestamo-dialog"
import { GenerarDocumentoDialog } from "@/components/generar-documento-dialog"
import { NotificacionDialog } from "@/components/notificacion-dialog"
import { ConfirmarPagoDialog } from "@/components/confirmar-pago-dialog"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { getPrestamo, updatePrestamo, markCuotaPagada, updatePrestamoConNuevaAmortizacion } from "@/lib/services/prestamos"
import { ArrowLeftIcon, FileEditIcon, FileTextIcon, DownloadIcon, CheckCircleIcon, BellIcon } from "lucide-react"

// Dado que React.use() tiene problemas con TypeScript actualmente,
// usaremos el método tradicional con advertencia para mantener el código funcional
export default function DetallePrestamo({ params }: { params: { id: string } }) {
  const router = useRouter()
  // Extraemos el ID directamente (método tradicional con advertencia)
  const prestamoId = params.id
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [documentoDialogOpen, setDocumentoDialogOpen] = useState(false)
  const [notificacionDialogOpen, setNotificacionDialogOpen] = useState(false)
  const [confirmarPagoDialogOpen, setConfirmarPagoDialogOpen] = useState(false)

  const fetchPrestamo = async () => {
    setLoading(true)
    try {
      const data = await getPrestamo(prestamoId)
      if (data) {
        setPrestamo(data)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching prestamo:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestamo()
  }, [prestamoId])

  const handleMarcarPagado = () => {
    if (!prestamo) return
    setConfirmarPagoDialogOpen(true)
  }

  const confirmarPago = async () => {
    if (!prestamo) return

    try {
      // Incrementar cuotas pagadas y marcar la cuota como pagada
      const proximoCuotaMes = (prestamo.cuotasPagadas || 0) + 1
      const prestamoActualizado = await markCuotaPagada(prestamo.id, proximoCuotaMes)

      if (prestamoActualizado) {
        setPrestamo(prestamoActualizado)
      }
    } catch (error) {
      console.error("Error marking cuota as paid:", error)
    }

    setConfirmarPagoDialogOpen(false)
  }

  const handleActualizarPrestamo = async (datosActualizados: Partial<Prestamo>) => {
    if (!prestamo) return

    try {
      // Si los datos actualizados contienen una tabla de amortización, usamos la función especializada
      if (datosActualizados.tablaAmortizacion && datosActualizados.monto && datosActualizados.cuotas &&
        datosActualizados.tasa_mensual && datosActualizados.fecha_inicio && datosActualizados.cuota_mensual) {
        // Usar la nueva función para actualizar préstamo con tabla de amortización
        const prestamoActualizado = await updatePrestamoConNuevaAmortizacion(prestamo.id, {
          monto: datosActualizados.monto,
          cuotas: datosActualizados.cuotas,
          tasa_mensual: datosActualizados.tasa_mensual,
          fecha_inicio: datosActualizados.fecha_inicio,
          cuota_mensual: datosActualizados.cuota_mensual,
          tablaAmortizacion: datosActualizados.tablaAmortizacion
        });

        if (prestamoActualizado) {
          setPrestamo(prestamoActualizado);
        }
      } else {
        // Usar la función original para actualizar solo datos básicos
        const prestamoActualizado = await updatePrestamo(prestamo.id, {
          nombre: datosActualizados.deudor?.nombre,
          cedula: datosActualizados.deudor?.cedula,
          ciudad: datosActualizados.deudor?.ciudad,
          telefono: datosActualizados.deudor?.telefono,
          estado: datosActualizados.estado,
          observaciones: datosActualizados.observaciones
        });

        if (prestamoActualizado) {
          setPrestamo(prestamoActualizado);
        }
      }
    } catch (error) {
      console.error("Error updating prestamo:", error);
    }

    setEditarDialogOpen(false);
  };

  if (loading) {
    return <div className="container mx-auto p-4 flex items-center justify-center h-screen">Cargando...</div>
  }

  if (!prestamo) {
    return <div className="container mx-auto p-4 flex items-center justify-center h-screen">Préstamo no encontrado</div>
  }

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

  // Calcular la próxima cuota a pagar
  const proximaCuota =
    prestamo.cuotasPagadas !== undefined && prestamo.cuotasPagadas < prestamo.cuotas
      ? prestamo.tablaAmortizacion[prestamo.cuotasPagadas]
      : null

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Detalle del préstamo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del deudor</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Nombre:</p>
              <p>{prestamo.deudor.nombre}</p>
            </div>
            <div>
              <p className="font-medium">Cédula:</p>
              <p>{prestamo.deudor.cedula}</p>
            </div>
            <div>
              <p className="font-medium">Ciudad:</p>
              <p>{prestamo.deudor.ciudad}</p>
            </div>
            <div>
              <p className="font-medium">Teléfono:</p>
              <p>{prestamo.deudor.telefono}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del préstamo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Monto prestado:</p>
              <p>{formatCurrency(prestamo.monto)}</p>
            </div>
            <div>
              <p className="font-medium">Plazo:</p>
              <p>{prestamo.cuotas} meses</p>
            </div>
            <div>
              <p className="font-medium">Tasa de interés:</p>
              <p>{prestamo.tasa_mensual}% mensual</p>
            </div>
            <div>
              <p className="font-medium">Fecha de inicio:</p>
              <p>{prestamo.fecha_inicio}</p>
            </div>
            <div>
              <p className="font-medium">Ganancia total:</p>
              <p className="text-green-600 dark:text-green-400 font-semibold">
                {formatCurrency(prestamo.tablaAmortizacion.reduce((total, cuota) => total + cuota.interes, 0))}
              </p>
            </div>
            <div>
              <p className="font-medium">Total a pagar:</p>
              <p>{formatCurrency(prestamo.monto + prestamo.tablaAmortizacion.reduce((total, cuota) => total + cuota.interes, 0))}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del préstamo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Estado:</p>
              <div className="mt-1">{getEstadoBadge(prestamo.estado)}</div>
            </div>
            <div>
              <p className="font-medium">Cuota mensual:</p>
              <p className="text-xl font-bold">{formatCurrency(prestamo.cuota_mensual)}</p>
            </div>
            <div>
              <p className="font-medium">Cuotas pagadas:</p>
              <p>
                {prestamo.cuotasPagadas || 0} de {prestamo.cuotas}
              </p>
            </div>
            <div>
              <p className="font-medium">Saldo pendiente:</p>
              <p>{formatCurrency(prestamo.monto - (prestamo.cuotasPagadas || 0) * prestamo.cuota_mensual)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={handleMarcarPagado}
          disabled={prestamo.estado === "pagado" || (prestamo.cuotasPagadas || 0) >= prestamo.cuotas}
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Marcar cuota como pagada
        </Button>
        <Button variant="outline" onClick={() => setEditarDialogOpen(true)}>
          <FileEditIcon className="h-4 w-4 mr-2" />
          Editar préstamo
        </Button>
        <Button variant="outline" onClick={() => setDocumentoDialogOpen(true)}>
          <FileTextIcon className="h-4 w-4 mr-2" />
          Generar documento
        </Button>
        <Button variant="outline" onClick={() => setNotificacionDialogOpen(true)}>
          <BellIcon className="h-4 w-4 mr-2" />
          Configurar recordatorio
        </Button>
        <Button variant="outline">
          <DownloadIcon className="h-4 w-4 mr-2" />
          Exportar tabla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de amortización</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <TablaAmortizacion cuotas={prestamo.tablaAmortizacion} cuotasPagadas={prestamo.cuotasPagadas || 0} />
        </CardContent>
      </Card>

      <EditarPrestamoDialog
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        prestamo={prestamo}
        onSave={handleActualizarPrestamo}
      />

      <GenerarDocumentoDialog open={documentoDialogOpen} onOpenChange={setDocumentoDialogOpen} prestamo={prestamo} />

      <NotificacionDialog open={notificacionDialogOpen} onOpenChange={setNotificacionDialogOpen} prestamo={prestamo} />

      <ConfirmarPagoDialog
        open={confirmarPagoDialogOpen}
        onOpenChange={setConfirmarPagoDialogOpen}
        prestamo={prestamo}
        proximaCuota={proximaCuota}
        onConfirm={confirmarPago}
      />
    </div>
  )
}
