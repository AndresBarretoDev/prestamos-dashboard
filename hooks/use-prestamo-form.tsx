"use client"

import { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"

import { prestamoSchema, type PrestamoFormValues, ciudadesDisponibles } from "@/lib/schemas/prestamoSchema"
import { calcularCuotaMensual, calcularTablaAmortizacion, calcularGananciaTotal, calcularTotalPagado } from "@/lib/calculadora"
import type { Cuota } from "@/lib/types"

const defaultValues: Partial<PrestamoFormValues> = {
    nombre: "",
    cedula: "",
    ciudad: "Bogotá", // Este es uno de los valores permitidos del enum
    telefono: "",
    monto: undefined,
    cuotas: undefined,
    tasa_mensual: undefined,
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
}

export const usePrestamo = () => {
    const [resultados, setResultados] = useState<{
        cuotaMensual: number
        tablaAmortizacion: Cuota[]
        gananciaTotal: number
        totalPagado: number
    } | null>(null)

    const [isCalculating, setIsCalculating] = useState(false)

    const form = useForm<PrestamoFormValues>({
        resolver: zodResolver(prestamoSchema),
        defaultValues,
    })

    const onFormSubmit: SubmitHandler<PrestamoFormValues> = async (data) => {
        setIsCalculating(true)
        try {
            const cuotaMensual = calcularCuotaMensual(data.monto, data.tasa_mensual, data.cuotas)
            const tablaAmortizacion = calcularTablaAmortizacion(data.monto, data.tasa_mensual, data.cuotas, cuotaMensual, data.fecha_inicio)
            const gananciaTotal = calcularGananciaTotal(tablaAmortizacion)
            const totalPagado = calcularTotalPagado(data.monto, tablaAmortizacion)

            setResultados({
                cuotaMensual,
                tablaAmortizacion,
                gananciaTotal,
                totalPagado,
            })
        } finally {
            setIsCalculating(false)
        }
    }

    const reset = () => {
        form.reset(defaultValues)
        setResultados(null)
    }

    return {
        form,
        onSubmit: form.handleSubmit(onFormSubmit),
        reset,
        resultados,
        isSubmitting: isCalculating || form.formState.isSubmitting,
        errors: form.formState.errors,
    }
} 