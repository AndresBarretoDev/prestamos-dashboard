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
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon, RefreshCcw, BarChart3, PieChart, LineChart, LayoutDashboard } from "lucide-react"
import type { Prestamo } from "@/lib/types"
import { getPrestamos } from "@/lib/services/prestamos"

export function Dashboard() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")
  const [showAllCharts, setShowAllCharts] = useState(true)
  const [selectedCharts, setSelectedCharts] = useState<string[]>(["pie", "bar", "line"])

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

  const toggleChart = (chartId: string) => {
    if (selectedCharts.includes(chartId)) {
      setSelectedCharts(selectedCharts.filter(id => id !== chartId))
    } else {
      setSelectedCharts([...selectedCharts, chartId])
    }
  }

  const isChartSelected = (chartId: string) => selectedCharts.includes(chartId)

  // Componentes de carga con Skeleton
  const SkeletonResumenCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[100px] mb-2" />
            <Skeleton className="h-3 w-[140px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const SkeletonCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(3).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const SkeletonTable = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-full sm:w-72" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="rounded-md border">
        <div className="p-4">
          <Skeleton className="h-12 w-full mb-4" />
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-4" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-[300px] mx-auto" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Gestiona tus préstamos y visualiza el estado de tus finanzas</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
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
        <>
          <SkeletonResumenCards />
          <SkeletonCharts />
          <SkeletonTable />
        </>
      ) : (
        <>
          <ResumenCards prestamos={prestamos} />

          {/* Controles de visualización de gráficos */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gráficas y visualizaciones</h2>
            <div className="flex gap-2">
              <Button
                variant={isChartSelected("pie") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleChart("pie")}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Circular
              </Button>
              <Button
                variant={isChartSelected("bar") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleChart("bar")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Barras
              </Button>
              <Button
                variant={isChartSelected("line") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleChart("line")}
              >
                <LineChart className="h-4 w-4 mr-2" />
                Líneas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCharts(showAllCharts ? [] : ["pie", "bar", "line"])}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {showAllCharts ? "Ocultar todos" : "Mostrar todos"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isChartSelected("pie") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    Distribución por estado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GraficoCircular prestamos={prestamos} />
                </CardContent>
              </Card>
            )}

            {isChartSelected("bar") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Prestado vs Recuperado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GraficoBarras prestamos={prestamos} />
                </CardContent>
              </Card>
            )}

            {isChartSelected("line") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Evolución de saldo pendiente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GraficoLineas prestamos={prestamos} />
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
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
