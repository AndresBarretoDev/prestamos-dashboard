import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { SkeletonDetallePrestamo } from "@/components/skeleton-detalle-prestamo"
import { decodePrestamoId } from '@/lib/utils/share'
import PublicPrestamoClient from './public-prestamo-client'

interface PublicPrestamoPageProps {
    params: { token: string }
}

// Página pública para ver préstamos compartidos
export default async function PublicPrestamoPage({ params }: PublicPrestamoPageProps) {
    const { token } = await params

    // Decodificar el token para obtener el ID del préstamo
    const prestamoId = decodePrestamoId(token)

    if (!prestamoId) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header simple */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Información de Préstamo
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vista pública - Solo lectura
                    </p>
                </div>
            </div>

            {/* Contenido del préstamo */}
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<SkeletonDetallePrestamo />}>
                    <PublicPrestamoClient prestamoId={prestamoId} />
                </Suspense>
            </div>
        </div>
    )
}
