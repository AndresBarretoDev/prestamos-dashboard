'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { TablaAmortizacion } from "@/components/tabla-amortizacion"
import type { Prestamo } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye } from "lucide-react"
import { computeLoanStats } from "@/lib/utils/loan-stats"

interface PublicPrestamoViewProps {
    prestamo: Prestamo
}

export default function PublicPrestamoView({ prestamo }: PublicPrestamoViewProps) {
    const stats = computeLoanStats(prestamo)
    const cuotasPagadas = stats.cuotasPagadas
    const cuotasPendientes = stats.cuotasPendientes
    const totalPagado = stats.totalPagadoReal
    const totalAbonosAdicionales = stats.totalAbonosExtra
    const saldoPendiente = stats.saldoTotalPendienteTeorico
    // Solo para uso interno; no mostrar al deudor
    const saldoCapitalPendiente = stats.capitalPendienteReal

    return (
        <div className="space-y-6">
            {/* Advertencia de vista pública */}
            <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                    Esta es una vista pública de solo lectura. No puedes realizar cambios desde aquí.
                </AlertDescription>
            </Alert>

            {/* Información del Deudor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium">Nombre:</p>
                            <p className="text-gray-600 dark:text-gray-300">{prestamo.deudor.nombre}</p>
                        </div>
                        <div>
                            <p className="font-medium">Cédula:</p>
                            <p className="text-gray-600 dark:text-gray-300">{prestamo.deudor.cedula}</p>
                        </div>
                        <div>
                            <p className="font-medium">Ciudad:</p>
                            <p className="text-gray-600 dark:text-gray-300">{prestamo.deudor.ciudad || 'No especificada'}</p>
                        </div>
                        <div>
                            <p className="font-medium">Teléfono:</p>
                            <p className="text-gray-600 dark:text-gray-300">{prestamo.deudor.telefono}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Información del Préstamo */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Detalles del préstamo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="font-medium">Monto:</p>
                            <p className="text-lg font-bold">
                                {formatCurrency(prestamo.monto)}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium">Tasa mensual:</p>
                            <p className="text-lg font-semibold">{prestamo.tasa_mensual}%</p>
                        </div>
                        <div>
                            <p className="font-medium">Estado:</p>
                            <Badge variant={prestamo.estado === 'activo' ? 'default' : 'secondary'}>
                                {prestamo.estado}
                            </Badge>
                        </div>
                        <div>
                            <p className="font-medium">Cuota mensual:</p>
                            <p className="text-lg font-semibold">{formatCurrency(prestamo.cuota_mensual)}</p>
                        </div>
                        <div>
                            <p className="font-medium">Total cuotas:</p>
                            <p className="text-lg font-semibold">{prestamo.cuotas}</p>
                        </div>
                        <div>
                            <p className="font-medium">Fecha inicio:</p>
                            <p className="text-lg font-semibold">{new Date(prestamo.fecha_inicio).toLocaleDateString()}</p>
                        </div>
                    </CardContent>
                </Card>
                {/* Detalle de Abonos Adicionales (si existen) */}
                {totalAbonosAdicionales > 0 && (
                    <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="bg-green-50 dark:bg-green-900/20 p-4">
                            <CardTitle className="text-lg text-green-800 dark:text-green-200">
                                💰 Abonos adicionales a capital
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Has realizado abonos adicionales que reducen el capital de tu préstamo
                                </p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(totalAbonosAdicionales)}
                                </p>
                                <p className="text-xs text-gray-500 mt-2 hidden">
                                    Estos abonos reducen el saldo pendiente y pueden acortar el plazo del préstamo
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Resumen de Pagos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cuotas Pagadas</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{cuotasPagadas}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cuotas Pendientes</p>
                            <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{cuotasPendientes}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pagado</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPagado)}</p>
                            {totalAbonosAdicionales > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Incluye {formatCurrency(totalAbonosAdicionales)} de abonos extra
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Pendiente</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(saldoPendiente)}</p>
                        </div>
                    </CardContent>
                </Card>
                {/* Oculto: saldo capital pendiente no es relevante para el deudor */}
            </div>



            {/* Tabla de Amortización */}
            <Card className="border-none ">
                <CardContent className="overflow-x-auto pt-4">
                    <TablaAmortizacion
                        tablaAmortizacion={prestamo.tablaAmortizacion}
                        isPublicView={true} // Deshabilitar acciones de admin
                    />
                </CardContent>
            </Card>
        </div>
    )
}
