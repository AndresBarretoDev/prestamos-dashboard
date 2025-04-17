"use client"

import { cn } from "@/lib/utils"
import { usePrestamo } from "@/hooks/use-prestamo-form"
import { PrestamoFormTabs } from "./prestamo-form-tabs"
import React, { useState } from "react"
import { PrestamoFormValues } from "@/lib/schemas/prestamoSchema"

interface PrestamoFormProps {
    onSubmitSuccess?: (data: any) => void
    className?: string
}

export function PrestamoForm({
    onSubmitSuccess,
    className,
}: PrestamoFormProps) {
    const { form, onSubmit, reset, resultados, isSubmitting, errors } = usePrestamo()
    const [isGuardando, setIsGuardando] = useState(false)

    // Manejador del formulario con tipo consistente
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    const handleGuardar = () => {
        if (resultados && onSubmitSuccess) {
            setIsGuardando(true)

            try {
                // Añadimos los datos del formulario a los resultados para tener toda la información
                const formValues = form.getValues()
                onSubmitSuccess({
                    ...resultados,
                    ...formValues
                })
            } finally {
                setIsGuardando(false)
            }
        }
    }

    return (
        <div className={cn("space-y-6", className)}>
            <PrestamoFormTabs
                form={form}
                resultados={resultados}
                onSubmit={handleSubmit}
                onReset={reset}
                onGuardar={handleGuardar}
                isSubmitting={isSubmitting || isGuardando}
            />
        </div>
    )
} 