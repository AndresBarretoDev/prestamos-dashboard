import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SkeletonDetallePrestamo() {
    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center mb-6">
                <Skeleton className="h-10 w-20 mr-4" />
                <Skeleton className="h-8 w-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Card Información del deudor */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del deudor</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div key={`deudor-skeleton-${index}`}>
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Card Detalles del préstamo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del préstamo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div key={`detalle-skeleton-${index}`}>
                                <Skeleton className="h-4 w-28 mb-2" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Card Estado del préstamo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estado del préstamo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div key={`estado-skeleton-${index}`}>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3 mb-6">
                {[...Array(5)].map((_, index) => (
                    <Skeleton key={`button-skeleton-${index}`} className="h-10 w-40" />
                ))}
            </div>

            {/* Tabla de amortización */}
            <Card>
                <CardHeader>
                    <CardTitle>Tabla de amortización</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-12 w-full mb-4" />
                    {[...Array(8)].map((_, index) => (
                        <Skeleton key={`row-skeleton-${index}`} className="h-12 w-full mb-4" />
                    ))}
                </CardContent>
            </Card>
        </div>
    )
} 