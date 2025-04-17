import type { Prestamo } from "./types"
import {
  calcularCuotaMensual,
  calcularTablaAmortizacion,
  calcularGananciaTotal,
  calcularTotalPagado,
} from "./calculadora"

// Función para generar préstamos de ejemplo
function generarPrestamo(
  id: string,
  nombreDeudor: string,
  cedula: string,
  ciudad: string,
  telefono: string,
  montoPrestado: number,
  plazoMeses: number,
  tasaInteres: number,
  fechaInicio: string,
  estado: "activo" | "pagado" | "vencido",
  cuotasPagadas = 0,
): Prestamo {
  const cuotaMensual = calcularCuotaMensual(montoPrestado, tasaInteres, plazoMeses)
  const tablaAmortizacion = calcularTablaAmortizacion(montoPrestado, tasaInteres, plazoMeses, cuotaMensual)
  const gananciaTotal = calcularGananciaTotal(tablaAmortizacion)
  const totalPagado = calcularTotalPagado(montoPrestado, tablaAmortizacion)

  return {
    id,
    nombreDeudor,
    cedula,
    ciudad,
    telefono,
    montoPrestado,
    plazoMeses,
    tasaInteres,
    fechaInicio,
    cuotaMensual,
    tablaAmortizacion,
    estado,
    cuotasPagadas,
    gananciaTotal,
    totalPagado,
  }
}

// Datos de ejemplo para la aplicación
export const prestamosMock: Prestamo[] = [
  generarPrestamo(
    "1",
    "Carlos Rodríguez",
    "1234567890",
    "Bogotá",
    "3101234567",
    5000000,
    12,
    1.5,
    "2023-01-15",
    "activo",
    3,
  ),
  generarPrestamo(
    "2",
    "María López",
    "0987654321",
    "Medellín",
    "3157654321",
    10000000,
    24,
    1.2,
    "2023-03-10",
    "activo",
    2,
  ),
  generarPrestamo("3", "Juan Pérez", "5678901234", "Cali", "3209876543", 3000000, 6, 1.8, "2022-11-05", "pagado", 6),
  generarPrestamo(
    "4",
    "Ana Martínez",
    "4321098765",
    "Barranquilla",
    "3001234567",
    8000000,
    18,
    1.3,
    "2023-02-20",
    "vencido",
    4,
  ),
  generarPrestamo(
    "5",
    "Pedro Gómez",
    "9876543210",
    "Cartagena",
    "3112345678",
    15000000,
    36,
    1.1,
    "2023-04-05",
    "activo",
    1,
  ),
]
