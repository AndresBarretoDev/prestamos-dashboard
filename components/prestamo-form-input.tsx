"use client"

import { Button } from "@/components/ui/button"
import React from "react"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ciudadesDisponibles } from "@/lib/schemas/prestamoSchema"
import { UseFormReturn } from "react-hook-form"
import { PrestamoFormValues } from "@/lib/schemas/prestamoSchema"

interface PrestamoFormInputProps {
    form: UseFormReturn<PrestamoFormValues>
    onSubmit: React.FormEventHandler<HTMLFormElement>
    onReset: () => void
    isSubmitting: boolean
}

export function PrestamoFormInput({
    form,
    onSubmit,
    onReset,
    isSubmitting
}: PrestamoFormInputProps) {
    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez Rodríguez" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cedula"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de documento de identidad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ciudad"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ciudad de residencia</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una ciudad" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ciudadesDisponibles.map((ciudad) => (
                                                <SelectItem key={ciudad} value={ciudad}>
                                                    {ciudad}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="telefono"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono de contacto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="3101234567" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="monto"
                            render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                    <FormLabel>Monto del préstamo</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            placeholder="$ 1.000.000"
                                            value={value}
                                            onValueChange={(values) => {
                                                onChange(values.floatValue)
                                            }}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Entre $500.000 y $30.000.000
                                    </FormDescription>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tasa_mensual"
                            render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                    <FormLabel>Tasa de interés (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="2.5"
                                            value={value || ""}
                                            onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Tasa de interés mensual.
                                    </FormDescription>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cuotas"
                            render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                    <FormLabel>Plazo (meses)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="12"
                                            value={value || ""}
                                            onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Entre 6 y 48 meses.
                                    </FormDescription>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="fecha_inicio"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de inicio</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value}
                                        onChange={field.onChange}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Debe ser igual o posterior a la fecha actual.
                                </FormDescription>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        onClick={onReset}
                        variant="outline"
                    >
                        Reiniciar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Calculando..." : "Calcular"}
                    </Button>
                </div>
            </form>
        </Form>
    )
} 