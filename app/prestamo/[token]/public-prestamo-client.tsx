'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Prestamo } from "@/lib/types"
import PublicPrestamoView from './public-prestamo-view'

interface PublicPrestamoClientProps {
    prestamoId: string
}

export default function PublicPrestamoClient({ prestamoId }: PublicPrestamoClientProps) {
    const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPrestamo = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/prestamo/${prestamoId}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Préstamo no encontrado')
                    } else {
                        setError('Error al cargar la información del préstamo')
                    }
                    return
                }

                const data = await response.json()
                setPrestamo(data)
            } catch (err) {
                console.error('Error fetching prestamo:', err)
                setError('Error al cargar la información del préstamo')
            } finally {
                setLoading(false)
            }
        }

        if (prestamoId) {
            fetchPrestamo()
        }
    }, [prestamoId])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (!prestamo) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No se encontró información del préstamo</AlertDescription>
            </Alert>
        )
    }

    return <PublicPrestamoView prestamo={prestamo} />
}
