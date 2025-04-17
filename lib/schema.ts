import { z } from "zod"

export const prestamoSchema = z.object({
    nombre: z
        .string()
        .min(10, { message: "El nombre debe tener al menos 10 caracteres" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, {
            message: "El nombre solo debe contener letras",
        }),
    cedula: z
        .string()
        .regex(/^\d{10}$/, {
            message: "La cédula debe contener exactamente 10 dígitos numéricos"
        }),
    ciudad: z.enum(["Bogotá", "Tunja", "Medellín"], {
        errorMap: () => ({ message: "Seleccione una ciudad válida" }),
    }),
    telefono: z
        .string()
        .regex(/^\d{7,10}$/, {
            message: "El teléfono debe tener entre 7 y 10 dígitos numéricos",
        }),
    monto: z
        .number({
            invalid_type_error: "El monto es requerido",
            required_error: "El monto es requerido"
        })
        .min(100000, { message: "El monto mínimo es de $100.000" })
        .max(100000000, { message: "El monto máximo es de $100.000.000" }),
    tasa: z
        .number({
            invalid_type_error: "La tasa es requerida",
            required_error: "La tasa es requerida"
        })
        .min(0.1, { message: "La tasa mínima es 0.1%" })
        .max(5, { message: "La tasa máxima es 5%" }),
    plazo: z
        .number({
            invalid_type_error: "El plazo es requerido",
            required_error: "El plazo es requerido"
        })
        .min(1, { message: "El plazo mínimo es 1 mes" })
        .max(60, { message: "El plazo máximo es 60 meses" }),
    fechaInicio: z.date({
        required_error: "La fecha de inicio es requerida",
        invalid_type_error: "Formato de fecha inválido",
    }),
})

export type PrestamoFormValues = z.infer<typeof prestamoSchema> 