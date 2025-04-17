"use client"

import { useState } from "react"
import { updatePrestamoConNuevaAmortizacion } from "@/lib/api/prestamos"
import type { Prestamo, Cuota } from "@/lib/types"

interface UpdatePrestamoParams {
    id: string
    monto: number
    cuotas: number
    tasa_mensual: number
    fecha_inicio: string
    cuota_mensual: number
    tablaAmortizacion: Cuota[]
}

export function useUpdatePrestamoMutation() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updatePrestamo = async (params: UpdatePrestamoParams): Promise<Prestamo | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await updatePrestamoConNuevaAmortizacion(params.id, {
                monto: params.monto,
                cuotas: params.cuotas,
                tasa_mensual: params.tasa_mensual,
                fecha_inicio: params.fecha_inicio,
                cuota_mensual: params.cuota_mensual,
                tablaAmortizacion: params.tablaAmortizacion
            })

            if (!result) {
                throw new Error("No se pudo actualizar el préstamo")
            }

            return result
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocurrió un error al actualizar el préstamo"
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return {
        updatePrestamo,
        isLoading,
        error
    }
} 