// Export functions from services
import {
    getPrestamos,
    getPrestamo,
    createPrestamo,
    updatePrestamo,
    markCuotaPagada,
    updatePrestamoConNuevaAmortizacion
} from "@/lib/services/prestamos";

// Re-export functions
export {
    getPrestamos,
    getPrestamo,
    createPrestamo,
    updatePrestamo,
    markCuotaPagada,
    updatePrestamoConNuevaAmortizacion
}; 