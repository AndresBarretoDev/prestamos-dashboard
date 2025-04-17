"use client"

import { useState, useEffect, FormEvent } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { TablaAmortizacion } from "@/components/tabla-amortizacion"
import { UseFormReturn } from "react-hook-form"
import { PrestamoFormValues } from "@/lib/schemas/prestamoSchema"
import { Cuota } from "@/lib/types"
import React from "react"

// Importamos el componente de entrada del formulario desde la misma carpeta
import { PrestamoFormInput } from "./prestamo-form-input"

interface PrestamoFormTabsProps {
    form: UseFormReturn<PrestamoFormValues>
    resultados: {
        cuotaMensual: number
        tablaAmortizacion: Cuota[]
        gananciaTotal: number
        totalPagado: number
    } | null
    onSubmit: React.FormEventHandler<HTMLFormElement>
    onReset: () => void
    onGuardar: () => void
    isSubmitting: boolean
}

export function PrestamoFormTabs({
    form,
    resultados,
    onSubmit,
    onReset,
    onGuardar,
    isSubmitting
}: PrestamoFormTabsProps) {
    const [activeTab, setActiveTab] = useState("form")

    // Cambiar a la pestaña de resultados cuando se calculan
    useEffect(() => {
        if (resultados) {
            setActiveTab("results")
        }
    }, [resultados])

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="form">Formulario</TabsTrigger>
                <TabsTrigger value="results" disabled={!resultados}>
                    Resultados
                </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4 mt-4">
                <PrestamoFormInput
                    form={form}
                    onSubmit={onSubmit}
                    onReset={onReset}
                    isSubmitting={isSubmitting}
                />
            </TabsContent>

            <TabsContent value="results" className="space-y-4 mt-4">
                {resultados && (
                    <div className="space-y-6">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-lg font-semibold">Cuota Mensual</div>
                                    <div className="text-3xl font-bold mt-2">
                                        {formatCurrency(resultados.cuotaMensual)}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-lg font-semibold">Ganancia Total</div>
                                    <div className="text-3xl font-bold mt-2 text-green-600">
                                        {formatCurrency(resultados.gananciaTotal)}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-lg font-semibold">Total a Pagar</div>
                                    <div className="text-3xl font-bold mt-2">
                                        {formatCurrency(resultados.totalPagado)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Tabla de Amortización</h3>
                            <TablaAmortizacion cuotas={resultados.tablaAmortizacion} />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                onClick={() => setActiveTab("form")}
                                variant="outline"
                            >
                                Volver al formulario
                            </Button>
                            <Button type="button" onClick={onGuardar} disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Préstamo"}
                            </Button>
                        </div>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
} 