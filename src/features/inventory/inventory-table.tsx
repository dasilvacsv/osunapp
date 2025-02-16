"use client"

  import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getPaginationRowModel,
    RowSelectionState,
    ExpandedState,
  } from "@tanstack/react-table"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { motion, AnimatePresence } from "framer-motion"
  import { ChevronDown, ChevronRight, AlertCircle, Package2 } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { TransactionHistory } from "./transaction-history"
  import { getInventoryTransactions } from "./actions"
  import { columns } from "./columns"
  import { InventoryItem, InventoryTransaction } from "./types"
  import { Skeleton } from "@/components/ui/skeleton"
  import { Badge } from "@/components/ui/badge"
  import React, { useState } from "react"
  
  interface InventoryTableProps {
    items: InventoryItem[]
  }
  
  export function InventoryTable({ items }: InventoryTableProps) {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [expanded, setExpanded] = useState<ExpandedState>({})
    const [transactions, setTransactions] = useState<Record<string, InventoryTransaction[]>>({})
    const [loading, setLoading] = useState<Record<string, boolean>>({})
  
    const fetchTransactions = async (itemId: string) => {
      if (transactions[itemId]) return
      setLoading((prev) => ({ ...prev, [itemId]: true }))
      const result = await getInventoryTransactions(itemId)
      if (result.success) {
        setTransactions((prev) => ({ ...prev, [itemId]: result.data }))
      }
      setLoading((prev) => ({ ...prev, [itemId]: false }))
    }
  
    const safeData = Array.isArray(items) ? items : []
  
    const table = useReactTable({
      data: safeData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onRowSelectionChange: setRowSelection,
      onExpandedChange: setExpanded,
      getRowCanExpand: () => true,
      state: {
        rowSelection,
        expanded,
      },
    })
  
    return (
      <div className="space-y-4">
        <div className="rounded-md border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
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
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </motion.tr>
                      <AnimatePresence>
                        {row.getIsExpanded() && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <TableCell colSpan={columns.length + 1}>
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
                    <TableCell colSpan={columns.length + 1}>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No hay resultados</p>
                        <p className="text-sm text-muted-foreground/70">
                          No se encontraron artículos en el inventario
                        </p>
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
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
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