"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { EyeIcon, SearchIcon } from "lucide-react"
import type { Prestamo } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface PrestamosTableProps {
  prestamos: Prestamo[]
}

export function PrestamosTable({ prestamos }: PrestamosTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortField, setSortField] = useState<string>("nombre")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredPrestamos, setFilteredPrestamos] = useState<Prestamo[]>([])

  // Filtrar, ordenar y paginar préstamos
  useEffect(() => {
    let result = [...prestamos]

    // Filtrar por término de búsqueda (en el nombre o cédula)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.deudor.nombre.toLowerCase().includes(term) ||
        p.deudor.cedula.toLowerCase().includes(term)
      )
    }

    // Ordenar resultados
    result.sort((a, b) => {
      let valA, valB

      switch (sortField) {
        case "nombre":
          valA = a.deudor.nombre.toLowerCase()
          valB = b.deudor.nombre.toLowerCase()
          break
        case "monto":
          valA = a.monto
          valB = b.monto
          break
        case "cuota":
          valA = a.cuota_mensual
          valB = b.cuota_mensual
          break
        case "plazo":
          valA = a.cuotas
          valB = b.cuotas
          break
        default:
          valA = a.deudor.nombre.toLowerCase()
          valB = b.deudor.nombre.toLowerCase()
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1
      if (valA > valB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredPrestamos(result)
  }, [prestamos, searchTerm, sortField, sortDirection])

  // Obtener datos paginados
  const paginatedPrestamos = filteredPrestamos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredPrestamos.length / pageSize)

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>
      case "pagado":
        return <Badge className="bg-blue-500">Pagado</Badge>
      case "vencido":
        return <Badge className="bg-red-500">Vencido</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  // Manejar cambio de ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Generar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    // Lógica para mostrar páginas alrededor de la actual
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pages}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Renderizar ícono de ordenamiento
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? " ↑" : " ↓"
  }

  return (
    <div className="space-y-4">
      {/* Filtros y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page on new search
            }}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val))
              setCurrentPage(1) // Reset to first page on page size change
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filas por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("nombre")}
              >
                Nombre del deudor {renderSortIcon("nombre")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("monto")}
              >
                Monto prestado {renderSortIcon("monto")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("cuota")}
              >
                Cuota mensual {renderSortIcon("cuota")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("plazo")}
              >
                Número total de cuotas {renderSortIcon("plazo")}
              </TableHead>
              <TableHead>Estado del préstamo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPrestamos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {filteredPrestamos.length === 0 && searchTerm
                    ? "No hay resultados para tu búsqueda"
                    : "No hay préstamos registrados"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPrestamos.map((prestamo) => (
                <TableRow key={prestamo.id}>
                  <TableCell className="font-medium">{prestamo.deudor.nombre}</TableCell>
                  <TableCell>{formatCurrency(prestamo.monto)}</TableCell>
                  <TableCell>{formatCurrency(prestamo.cuota_mensual)}</TableCell>
                  <TableCell>{prestamo.cuotas}</TableCell>
                  <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/prestamos/${prestamo.id}`)}>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {renderPagination()}

      {/* Resumen de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {paginatedPrestamos.length} de {filteredPrestamos.length} préstamos
        {searchTerm && ` (filtrado de ${prestamos.length} total)`}
      </div>
    </div>
  )
}
