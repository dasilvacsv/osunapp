"use client"

import React from "react"

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
import { ChevronDown, ChevronRight, AlertCircle, Package2, Search, MoreHorizontal, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "./transaction-history"
import { getInventoryTransactions, disableInventoryItem } from "./actions"
import { columns } from "./columns"
import type { InventoryItem, InventoryTransaction } from "./types"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useState } from "react"
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

interface InventoryTableProps {
  items: InventoryItem[]
  onItemDisabled?: () => void
}

export function InventoryTable({ items, onItemDisabled }: InventoryTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [transactions, setTransactions] = useState<Record<string, InventoryTransaction[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [confirmDisableDialogOpen, setConfirmDisableDialogOpen] = useState(false)
  const [itemToDisable, setItemToDisable] = useState<string | null>(null)

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

    try {
      const result = await disableInventoryItem(itemToDisable)
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
    } catch (error) {
      console.error("Error disabling item:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al desactivar el producto.",
        variant: "destructive",
      })
    } finally {
      setConfirmDisableDialogOpen(false)
      setItemToDisable(null)
    }
  }

  const safeData = Array.isArray(items) ? items : []

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
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
                      className="relative group hover:bg-muted/50"
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
                      <p className="text-sm text-muted-foreground/70">No se encontraron artículos en el inventario</p>
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
          </div>
          <div className="text-sm text-muted-foreground">{safeData.length} producto(s) en total</div>
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

