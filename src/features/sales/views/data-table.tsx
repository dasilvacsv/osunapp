"use client"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
  type FilterFn,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchKey?: string
  onSaleSelect?: (sale: { id: string; amount: number }) => void
  isLoading?: boolean
  title?: string
  description?: string
  exportData?: () => void
  initialPageSize?: number
  filterPreSales?: boolean
}

// Función de filtro personalizada para búsqueda global
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Valor a buscar
  const searchValue = value.toLowerCase()

  // Si no hay valor de búsqueda, mostrar todas las filas
  if (!searchValue) return true

  // Obtener el valor de la celda
  let cellValue = row.getValue(columnId)

  // Si el valor es nulo o indefinido, intentar buscar en propiedades anidadas
  if (cellValue == null) {
    const original = row.original

    // Buscar en propiedades anidadas (client.name, beneficiario.name, etc.)
    if (columnId.includes(".")) {
      const parts = columnId.split(".")
      let value = original
      for (const part of parts) {
        if (value && typeof value === "object") {
          value = value[part]
        } else {
          value = undefined
          break
        }
      }
      cellValue = value
    } else {
      // Intentar buscar en el objeto original
      cellValue = original[columnId]
    }
  }

  // Convertir a string para la búsqueda
  const valueStr = String(cellValue || "").toLowerCase()

  // Verificar si el valor de la celda contiene el valor de búsqueda
  return valueStr.includes(searchValue)
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  onSaleSelect,
  isLoading = false,
  title,
  description,
  exportData,
  initialPageSize = 10,
  filterPreSales = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [searchValue, setSearchValue] = useState<string>("")
  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [showPreSalesOnly, setShowPreSalesOnly] = useState<boolean>(false)
  const [globalFilter, setGlobalFilter] = useState<string>("")

  // Escuchar eventos de actualización de ventas
  useEffect(() => {
    const handleSalesUpdated = (event: Event) => {
      // Forzar actualización de la tabla cuando se actualiza una venta
      const customEvent = event as CustomEvent
      console.log("Venta actualizada:", customEvent.detail)
    }

    window.addEventListener("sales-updated", handleSalesUpdated)
    return () => {
      window.removeEventListener("sales-updated", handleSalesUpdated)
    }
  }, [])

  // Columnas de búsqueda
  const searchableColumns = useMemo(() => {
    if (searchKey) {
      return [searchKey]
    }

    // Si no se proporciona searchKey, buscar en estas columnas
    return ["id", "client.name", "beneficiario.name", "bundleName", "organization.name", "totalAmount"]
  }, [searchKey])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      globalFilter: searchValue,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "fuzzy",
  })

  // Filtrar por pre-ventas si es necesario
  useEffect(() => {
    if (filterPreSales && showPreSalesOnly) {
      // Asumimos que hay una columna 'saleType' que podemos filtrar
      const filterColumn = table.getColumn("saleType")
      if (filterColumn) {
        filterColumn.setFilterValue(showPreSalesOnly ? "PRESALE" : undefined)
      }
    }
  }, [showPreSalesOnly, filterPreSales, table])

  // Efecto para aplicar el filtro global
  useEffect(() => {
    table.setGlobalFilter(searchValue)
  }, [searchValue, table])

  const handleSearch = (value: string) => {
    setSearchValue(value)

    // Si hay una columna específica para buscar, usar filtro de columna
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
    // De lo contrario, usar filtro global
    else {
      table.setGlobalFilter(value)
    }
  }

  const clearSearch = () => {
    setSearchValue("")
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue("")
    } else {
      table.setGlobalFilter("")
    }
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    table.setPageSize(Number(value))
  }

  const totalPages = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalRows = table.getFilteredRowModel().rows.length
  const visibleRows = table.getRowModel().rows.length

  return (
    <div className="space-y-3">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        {title && (
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ventas..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 w-full sm:w-[200px] lg:w-[300px]"
            />
            {searchValue && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 self-end">
            {filterPreSales && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showPreSalesOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPreSalesOnly(!showPreSalesOnly)}
                      className={cn("h-9 gap-1", showPreSalesOnly && "bg-red-500 hover:bg-red-600 text-white")}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">Pre-ventas</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showPreSalesOnly ? "Mostrar todas las ventas" : "Mostrar solo pre-ventas"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Columnas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel className="text-xs">Mostrar columnas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.id !== "actions" && column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => {
                          column.toggleVisibility(value)
                          setVisibleColumns({
                            ...visibleColumns,
                            [column.id]: value,
                          })
                        }}
                      >
                        {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {exportData && (
              <Button variant="outline" size="sm" onClick={exportData} className="h-9 gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden bg-card text-card-foreground shadow-sm">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando datos...</p>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-muted/50 bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "py-2 px-3 text-xs font-medium",
                        header.column.getCanSort() && "cursor-pointer select-none",
                      )}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                          {header.column.getIsSorted() === "asc" && (
                            <Badge variant="outline" className="ml-1 py-0 h-4 text-[10px]">
                              Asc
                            </Badge>
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <Badge variant="outline" className="ml-1 py-0 h-4 text-[10px]">
                              Desc
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                  {onSaleSelect && <TableHead className="py-2 px-3 text-xs font-medium">Acciones</TableHead>}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={cn(
                        "group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        // Highlight pre-sale rows if needed
                        (row.original as any)?.saleType === "PRESALE" && "bg-red-50/30 dark:bg-red-900/10",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2 px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      {onSaleSelect && (
                        <TableCell className="py-2 px-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onSaleSelect({
                                id: (row.original as any).id,
                                amount: (row.original as any).amount || (row.original as any).totalAmount,
                              })
                            }
                            className="h-7 text-xs flex items-center gap-1"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pagos
                          </Button>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (onSaleSelect ? 1 : 0)}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-sm">Cargando datos...</p>
                        </div>
                      ) : searchValue ? (
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-6 w-6 text-muted-foreground" />
                          <p>No se encontraron resultados para "{searchValue}"</p>
                          <Button variant="ghost" size="sm" onClick={clearSearch} className="mt-2">
                            Limpiar búsqueda
                          </Button>
                        </div>
                      ) : showPreSalesOnly ? (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                          <p>No hay pre-ventas disponibles</p>
                          <Button variant="ghost" size="sm" onClick={() => setShowPreSalesOnly(false)} className="mt-2">
                            Mostrar todas las ventas
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
                          <p>No hay datos disponibles</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Mostrando <span className="font-medium">{visibleRows}</span> de{" "}
              <span className="font-medium">{totalRows}</span> resultados
              {showPreSalesOnly && (
                <span className="ml-1 text-red-500 dark:text-red-400">(Filtrado: solo pre-ventas)</span>
              )}
            </p>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()} className="text-xs">
                    {size} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Primera página</span>
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs flex items-center gap-1 px-2">
              <span className="font-medium">{currentPage}</span>
              <span className="text-muted-foreground">de</span>
              <span className="font-medium">{totalPages || 1}</span>
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Última página</span>
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

