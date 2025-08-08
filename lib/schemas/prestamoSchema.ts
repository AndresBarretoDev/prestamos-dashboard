import { z } from "zod";

// Lista de ciudades disponibles
export const ciudadesDisponibles = ["Bogotá", "Tunja", "Medellín", "Cali", "Barranquilla"] as const;

// Esquema de validación para el formulario de préstamo
export const prestamoSchema = z.object({
    // Nombre: obligatorio, mínimo 10 caracteres, solo letras, espacios, tildes y "ñ"
    nombre: z
        .string()
        .min(10, { message: "El nombre debe tener al menos 10 caracteres" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, {
            message: "El nombre solo debe contener letras",
        }),

    // Cédula: obligatorio, exactamente 10 dígitos numéricos
    cedula: z
        .string()
        .regex(/^\d{7,10}$/, {
            message: "La cédula debe ser un número válido"
        }),

    // Ciudad: obligatorio, debe ser una de las ciudades disponibles
    ciudad: z.enum(ciudadesDisponibles, {
        errorMap: () => ({ message: "Seleccione una ciudad válida" }),
    }),

    // Teléfono: obligatorio, entre 7 y 10 dígitos numéricos
    telefono: z
        .string()
        .regex(/^\d{7,10}$/, {
            message: "El teléfono debe tener entre 7 y 10 dígitos numéricos",
        }),

    // Monto: obligatorio, entre 500.000 y 30.000.000 pesos colombianos
    monto: z
        .number({
            invalid_type_error: "El monto es requerido",
            required_error: "El monto es requerido"
        })
        .min(500000, { message: "El monto mínimo es de $500.000" })
        .max(30000000, { message: "El monto máximo es de $30.000.000" }),

    // Plazo: obligatorio, entre 6 y 48 meses
    cuotas: z
        .number({
            invalid_type_error: "El plazo es requerido",
            required_error: "El plazo es requerido"
        })
        .min(6, { message: "El plazo mínimo es 6 meses" })
        .max(48, { message: "El plazo máximo es 48 meses" }),

    // Tasa: obligatorio, mayor a 0, permite decimales
    tasa_mensual: z
        .number({
            invalid_type_error: "La tasa es requerida",
            required_error: "La tasa es requerida"
        })
        .min(0.1, { message: "La tasa mínima es 0.1%" })
        .max(5, { message: "La tasa máxima es 5%" }),

    // Fecha de inicio: obligatorio, debe ser igual o posterior a la fecha actual
    fecha_inicio: z.string({
        required_error: "La fecha de inicio es requerida",
        invalid_type_error: "Formato de fecha inválido",
    }).refine(
        (date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate >= today;
        },
        {
            message: "La fecha debe ser igual o posterior a la fecha actual",
        }
    ),
});

// Tipo inferido del esquema para usar en formularios
export type PrestamoFormValues = z.infer<typeof prestamoSchema>;

// Schema para edición - opcional para algunos campos
export const prestamoEditSchema = prestamoSchema.partial({
    nombre: true,
    cedula: true,
    ciudad: true,
    telefono: true,
});

export type PrestamoEditFormValues = z.infer<typeof prestamoEditSchema>; 