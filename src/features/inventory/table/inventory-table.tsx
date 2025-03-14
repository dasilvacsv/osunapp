"use client"

import React, { useState } from "react"

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  type RowSelectionState,
  type ExpandedState,
  getSortedRowModel,
  type SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, AlertCircle, Package2, Search, MoreHorizontal, Archive, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "./transaction-history"
import { getInventoryTransactions } from "./actions"
import { columns } from "./columns"
import type { InventoryItem, InventoryTransaction } from "./types"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { updateInventoryItemStatus, updatePreSaleFlag } from "../actions"
import type { InventoryTableProps } from "../types"

export function InventoryTable({ items, onItemDisabled, onItemUpdated }: InventoryTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [transactions, setTransactions] = useState<Record<string, InventoryTransaction[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [confirmDisableDialogOpen, setConfirmDisableDialogOpen] = useState(false)
  const [itemToDisable, setItemToDisable] = useState<string | null>(null)
  const [showPreSaleOnly, setShowPreSaleOnly] = useState(false)

  const { toast } = useToast()

  const fetchTransactions = async (itemId: string) => {
    if (transactions[itemId]) return
    setLoading((prev) => ({ ...prev, [itemId]: true }))
    const result = await getInventoryTransactions(itemId)
    if (result.success) {
      setTransactions((prev) => ({ ...prev, [itemId]: result.data }))
    }
    setLoading((prev) => ({ ...prev, [itemId]: false }))
  }

  const handleDisableItem = async (id: string) => {
    setItemToDisable(id)
    setConfirmDisableDialogOpen(true)
  }

  const confirmDisable = async () => {
    if (!itemToDisable) return

    const result = await updateInventoryItemStatus(itemToDisable, "INACTIVE")
    if (result.success) {
      toast({
        title: "Producto desactivado",
        description: "El producto ha sido desactivado exitosamente.",
      })
      if (onItemDisabled) {
        onItemDisabled()
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo desactivar el producto.",
        variant: "destructive",
      })
    }
    setConfirmDisableDialogOpen(false)
    setItemToDisable(null)
  }

  const handlePreSaleToggle = async (id: string, currentValue: boolean) => {
    const result = await updatePreSaleFlag(id, !currentValue)
    if (result.success) {
      toast({
        title: !currentValue ? "Pre-venta habilitada" : "Pre-venta deshabilitada",
        description: !currentValue
          ? "Ahora se puede vender este producto sin stock disponible"
          : "Este producto ahora requiere stock disponible para venderse",
      })
      if (onItemUpdated) {
        onItemUpdated()
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo actualizar la configuración de pre-venta",
        variant: "destructive",
      })
    }
  }

  // Filtrar los items para mostrar solo los que tienen pre-venta habilitada
  const filteredItems = showPreSaleOnly ? items.filter((item) => item.allowPreSale) : items

  const safeData = Array.isArray(filteredItems) ? filteredItems : []

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      expanded,
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Contar cuántos productos tienen pre-venta habilitada
  const preSaleCount = items.filter((item) => item.allowPreSale).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showPreSaleOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreSaleOnly(!showPreSaleOnly)}
            className={showPreSaleOnly ? "bg-red-500 hover:bg-red-600 text-white" : ""}
          >
            <Flag className="h-4 w-4 mr-2" />
            {showPreSaleOnly ? "Todos los productos" : "Solo pre-ventas"}
            {preSaleCount > 0 && !showPreSaleOnly && (
              <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">{preSaleCount}</Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={table.getPageCount() === 0}
            onClick={() => table.setPageIndex(0)}
            className="hidden sm:flex"
          >
            Primera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={table.getPageCount() === 0}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            className="hidden sm:flex"
          >
            Última
          </Button>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[50px]"></TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`relative group hover:bg-muted/50 ${row.original.allowPreSale ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            row.toggleExpanded()
                            if (!row.getIsExpanded()) {
                              fetchTransactions(row.original.id)
                            }
                          }}
                          className="transition-transform group-hover:scale-110"
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePreSaleToggle(row.original.id, row.original.allowPreSale)}
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              {row.original.allowPreSale ? "Deshabilitar pre-venta" : "Habilitar pre-venta"}
                            </DropdownMenuItem>
                            {row.original.status === "ACTIVE" && (
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={() => handleDisableItem(row.original.id)}
                              >
                                <Archive className="mr-2 h-4 w-4" /> Desactivar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                    <AnimatePresence>
                      {row.getIsExpanded() && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TableCell colSpan={columns.length + 2}>
                            <motion.div
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="p-4 bg-muted rounded-lg"
                            >
                              {loading[row.original.id] ? (
                                <div className="space-y-3">
                                  <Skeleton className="h-8 w-full" />
                                  <Skeleton className="h-8 w-full" />
                                  <Skeleton className="h-8 w-full" />
                                </div>
                              ) : transactions[row.original.id]?.length > 0 ? (
                                <TransactionHistory transactions={transactions[row.original.id]} />
                              ) : (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>No hay historial de transacciones disponible</span>
                                </div>
                              )}
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 2}>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No hay resultados</p>
                      {showPreSaleOnly ? (
                        <p className="text-sm text-muted-foreground/70">
                          No se encontraron productos con pre-venta habilitada
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/70">No se encontraron artículos en el inventario</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
      {table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            {showPreSaleOnly && (
              <span className="ml-2 text-red-500 dark:text-red-400">(Filtrado: solo productos con pre-venta)</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {safeData.length} producto(s) en total
            {preSaleCount > 0 && (
              <span className="ml-2">
                (<Flag className="h-3 w-3 inline-block text-red-500" /> {preSaleCount} con pre-venta)
              </span>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={confirmDisableDialogOpen} onOpenChange={setConfirmDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas desactivar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no eliminará el producto, pero lo marcará como inactivo y no aparecerá en las búsquedas de
              productos activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

