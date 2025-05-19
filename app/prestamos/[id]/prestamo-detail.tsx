"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TablaAmortizacion } from "@/components/tabla-amortizacion"
import { SkeletonDetallePrestamo } from "@/components/skeleton-detalle-prestamo"
import { EditarPrestamoDialog } from "@/components/editar-prestamo-dialog"
import { GenerarDocumentoDialog } from "@/components/generar-documento-dialog"
import { NotificacionDialog } from "@/components/notificacion-dialog"
import { ConfirmarPagoDialog } from "@/components/confirmar-pago-dialog"
import { AbonoCapitalDialog } from "@/components/abono-capital-dialog"
import { HistorialAbonos } from "@/components/historial-abonos"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getPrestamo, updatePrestamo, markCuotaPagada, updatePrestamoConNuevaAmortizacion, registrarAbonoCapital, getAbonosCapital } from "@/lib/services/prestamos"
import { ArrowLeftIcon, FileEditIcon, FileTextIcon, DownloadIcon, CheckCircleIcon, BellIcon } from "lucide-react"

interface PrestamoDetailProps {
    id: string
}

export default function PrestamoDetail({ id }: PrestamoDetailProps) {
    const router = useRouter()
    const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
    const [loading, setLoading] = useState(true)
    const [editarDialogOpen, setEditarDialogOpen] = useState(false)
    const [documentoDialogOpen, setDocumentoDialogOpen] = useState(false)
    const [notificacionDialogOpen, setNotificacionDialogOpen] = useState(false)
    const [confirmarPagoDialogOpen, setConfirmarPagoDialogOpen] = useState(false)
    const [abonos, setAbonos] = useState<any[]>([])
    const [isAbonoDialogOpen, setIsAbonoDialogOpen] = useState(false)

    const fetchPrestamo = async () => {
        setLoading(true)
        try {
            const data = await getPrestamo(id)
            if (data) {
                setPrestamo(data)
                const abonosData = await getAbonosCapital(data.id)
                setAbonos(abonosData)
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
    }, [id])

    const handleMarcarPagado = () => {
        if (!prestamo) return
        setConfirmarPagoDialogOpen(true)
    }

    const confirmarPago = async (valorPagado: number, registrarExcedente: boolean): Promise<void> => {
        if (!prestamo) throw new Error("No hay préstamo seleccionado");

        try {
            // Incrementar cuotas pagadas y marcar la cuota como pagada
            const proximoCuotaMes = (prestamo.cuotasPagadas || 0) + 1

            // Obtener la próxima cuota para pasar su valor
            const proximaCuota = prestamo.tablaAmortizacion.find(c => c.numero === proximoCuotaMes)
            if (!proximaCuota) throw new Error("No se encontró la cuota a pagar");

            const prestamoActualizado = await markCuotaPagada(
                prestamo.id,
                proximoCuotaMes,
                valorPagado,
                registrarExcedente
            );

            if (prestamoActualizado) {
                setPrestamo(prestamoActualizado);
                // Actualizar la lista de abonos si se registró un excedente
                if (registrarExcedente && valorPagado > proximaCuota.valor) {
                    const abonosData = await getAbonosCapital(prestamo.id);
                    setAbonos(abonosData);
                }
                setConfirmarPagoDialogOpen(false);
            } else {
                throw new Error("No se pudo actualizar el préstamo");
            }
        } catch (error) {
            console.error("Error marking cuota as paid:", error);
            throw error; // Relanzar el error para que pueda ser manejado en el componente del diálogo
        }
    };

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

    const handleAbonoConfirm = async (data: {
        monto: number
        fecha_abono: string
        observaciones?: string
        tipo_recalculo: 'reducir_cuota' | 'reducir_plazo'
    }): Promise<void> => {
        if (!prestamo) throw new Error("No hay préstamo seleccionado");

        try {
            const updatedPrestamo = await registrarAbonoCapital(prestamo.id, data);
            if (updatedPrestamo) {
                setPrestamo(updatedPrestamo);
                const abonosData = await getAbonosCapital(prestamo.id);
                setAbonos(abonosData);
                setIsAbonoDialogOpen(false);
            } else {
                throw new Error("No se pudo actualizar el préstamo");
            }
        } catch (error) {
            console.error("Error al registrar abono a capital:", error);
            throw error; // Relanzar el error para que pueda ser manejado en el componente del diálogo
        }
    };

    if (loading) {
        return <SkeletonDetallePrestamo />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
                <Button variant="outline" onClick={() => setIsAbonoDialogOpen(true)}>
                    Registrar Abono a Capital
                </Button>
                <Button variant="outline">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exportar tabla
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Tabla de amortización</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <TablaAmortizacion cuotas={prestamo.tablaAmortizacion} cuotasPagadas={prestamo.cuotasPagadas || 0} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Abonos a Capital</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <HistorialAbonos abonos={abonos} />
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
                onConfirm={(valorPagado, registrarExcedente) => confirmarPago(valorPagado, registrarExcedente)}
            />

            <AbonoCapitalDialog
                open={isAbonoDialogOpen}
                onOpenChange={setIsAbonoDialogOpen}
                prestamo={prestamo}
                onConfirm={handleAbonoConfirm}
            />
        </div>
    )
} 