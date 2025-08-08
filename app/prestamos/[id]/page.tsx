import { Suspense } from 'react'
import PrestamoDetail from './prestamo-detail'
import { SkeletonDetallePrestamo } from "@/components/skeleton-detalle-prestamo"
import { AuthGuard } from "@/components/auth/auth-guard"

// Componente de página (Server Component)
export default async function PrestamoPage({ params }: { params: { id: string } }) {
  const { id } = await params
  return (
    <AuthGuard requireOwnership={true} prestamoId={id}>
      <Suspense fallback={<SkeletonDetallePrestamo />}>
        <PrestamoDetail id={id} />
      </Suspense>
    </AuthGuard>
  )
}
