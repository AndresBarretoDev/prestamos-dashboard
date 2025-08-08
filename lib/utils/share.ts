// Utilidades para compartir préstamos de forma sencilla

/**
 * Simplemente usa el ID del préstamo directamente
 * No necesitamos complicaciones innecesarias
 */
export function encodePrestamoId(id: string): string {
    return id; // Súper simple
}

/**
 * Decodifica un token compartido (que en realidad es solo el ID)
 */
export function decodePrestamoId(token: string): string | null {
    // Validar que es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(token)) {
        return token;
    }
    return null;
}

/**
 * Genera la URL completa para compartir un préstamo
 */
export function generateShareableUrl(prestamoId: string, baseUrl?: string): string {
    const token = encodePrestamoId(prestamoId);
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/prestamo/${token}`;
}
