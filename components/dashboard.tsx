"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PrestamosTable } from "@/components/prestamos-table"
import { NuevoPrestamoDialog } from "@/components/nuevo-prestamo-dialog"
import { ResumenCards } from "@/components/resumen-cards"
import { GraficoCircular } from "@/components/grafico-circular"
import { GraficoBarras } from "@/components/grafico-barras"
import { GraficoLineas } from "@/components/grafico-lineas"
import { PlusIcon, RefreshCcw } from "lucide-react"
import type { Prestamo } from "@/lib/types"
import { getPrestamos } from "@/lib/services/prestamos"

export function Dashboard() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPrestamos = async () => {
    setLoading(true)
    try {
      const data = await getPrestamos()
      setPrestamos(data)
    } catch (error) {
      console.error("Error fetching prestamos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestamos()
  }, [])

  const handleNuevoPrestamo = (nuevoPrestamo: Prestamo) => {
    setPrestamos([...prestamos, nuevoPrestamo])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Gestiona tus préstamos y visualiza el estado de tus finanzas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPrestamos} variant="outline" disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Nuevo préstamo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <p>Cargando préstamos...</p>
        </div>
      ) : (
        <>
          <ResumenCards prestamos={prestamos} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribución por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoCircular prestamos={prestamos} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Prestado vs Recuperado</CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoBarras prestamos={prestamos} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolución de saldo pendiente</CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoLineas prestamos={prestamos} />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="todos" className="w-full">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="pagados">Pagados</TabsTrigger>
              <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
            </TabsList>
            <TabsContent value="todos">
              <PrestamosTable prestamos={prestamos} />
            </TabsContent>
            <TabsContent value="activos">
              <PrestamosTable prestamos={prestamos.filter((p) => p.estado === "activo")} />
            </TabsContent>
            <TabsContent value="pagados">
              <PrestamosTable prestamos={prestamos.filter((p) => p.estado === "pagado")} />
            </TabsContent>
            <TabsContent value="vencidos">
              <PrestamosTable prestamos={prestamos.filter((p) => p.estado === "vencido")} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <NuevoPrestamoDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleNuevoPrestamo} />
    </div>
  )
}
