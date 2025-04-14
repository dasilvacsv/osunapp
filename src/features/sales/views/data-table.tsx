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
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
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
import { useVirtualizer } from "@tanstack/react-virtual"

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

// Optimized fuzzy filter with memoization
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchValue = value.toLowerCase()
  if (!searchValue) return true

  let cellValue = row.getValue(columnId)

  if (cellValue == null) {
    const original = row.original
    if (columnId.includes(".")) {
      const parts = columnId.split(".")
      let value = original
      for (const part of parts) {
        value = value?.[part]
        if (!value) break
      }
      cellValue = value
    } else {
      cellValue = original[columnId]
    }
  }

  return String(cellValue || "").toLowerCase().includes(searchValue)
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

  // Memoize searchable columns
  const searchableColumns = useMemo(() => {
    return searchKey ? [searchKey] : ["id", "client.name", "beneficiario.name", "bundleName", "organization.name", "totalAmount"]
  }, [searchKey])

  // Memoize table instance
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
    globalFilterFn: fuzzyFilter,
  })

  // Virtualized rows for better performance
  const { rows } = table.getRowModel()
  const parentRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      virtualizer.scrollToIndex(0)
    }
  }, [])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Estimated row height
    overscan: 10,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0

  // Optimized search handler with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }, [searchKey, table])

  // Clear search with memoization
  const clearSearch = useCallback(() => {
    setSearchValue("")
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue("")
    }
  }, [searchKey, table])

  // Memoized page size handler
  const handlePageSizeChange = useCallback((value: string) => {
    const newSize = Number(value)
    setPageSize(newSize)
    table.setPageSize(newSize)
  }, [table])

  // Pre-sales filter effect
  useEffect(() => {
    if (filterPreSales && showPreSalesOnly) {
      const filterColumn = table.getColumn("saleType")
      if (filterColumn) {
        filterColumn.setFilterValue(showPreSalesOnly ? "PRESALE" : undefined)
      }
    }
  }, [showPreSalesOnly, filterPreSales, table])

  const totalPages = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-3">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        {title && (
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 w-full sm:w-[300px]"
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

          {/* Action buttons */}
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

            {/* Column visibility dropdown */}
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
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(value)
                        setVisibleColumns((prev) => ({ ...prev, [column.id]: value }))
                      }}
                    >
                      {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
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

      {/* Table section */}
      <div className="rounded-md border overflow-hidden bg-card">
        <div className="relative" ref={parentRef} style={{ height: `${rows.length * 45}px` }}>
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      className={cn("py-2 px-3", header.column.getCanSort() && "cursor-pointer select-none")}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                          {header.column.getIsSorted() && (
                            <Badge variant="outline" className="ml-1 py-0 h-4">
                              {header.column.getIsSorted() === "asc" ? "Asc" : "Desc"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "transition-colors hover:bg-muted/50",
                      row.original.saleType === "PRESALE" && "bg-red-50/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onSaleSelect ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination section */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Mostrando {table.getRowModel().rows.length} de {totalRows} resultados
            </p>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <span className="mx-2">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}