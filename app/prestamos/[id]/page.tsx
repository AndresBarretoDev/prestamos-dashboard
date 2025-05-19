import { Suspense } from 'react'
import PrestamoDetail from './prestamo-detail'
import { SkeletonDetallePrestamo } from "@/components/skeleton-detalle-prestamo"

// Componente de página (Server Component)
export default async function PrestamoPage({ params }: { params: { id: string } }) {
  const { id } = await params
  return (
    <Suspense fallback={<SkeletonDetallePrestamo />}>
      <PrestamoDetail id={id} />
    </Suspense>
  )
}
