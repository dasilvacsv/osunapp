import React, { useState, useCallback, useEffect } from "react"
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
import { ChevronDown, ChevronRight, AlertCircle, Package2, Search, MoreHorizontal, Archive, Flag, Package, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "./transaction-history"
import { getInventoryTransactions } from "./actions"
import { updateInventoryItem, deleteInventoryItem } from "../actions"
import { columns } from "./columns"
import type { InventoryItem, InventoryTransaction } from "../types"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateInventoryItemStatus, updatePreSaleFlag } from "../actions"
import type { InventoryTableProps } from "../types"
import { AddProductDialog } from "../add-product-dialog"

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
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    description: "",
    basePrice: "",
    costPrice: "",
    currentStock: "",
    minimumStock: "",
    type: "",
    status: "",
    allowPresale: false,
  })
  const [deleteAuthCode, setDeleteAuthCode] = useState("")

  const { toast } = useToast()

  // Memoize the fetchTransactions function to prevent unnecessary re-renders
  const fetchTransactions = useCallback(
    async (itemId: string) => {
      if (transactions[itemId]) return
      setLoading((prev) => ({ ...prev, [itemId]: true }))
      try {
        const result = await getInventoryTransactions(itemId)
        if (result.success) {
          setTransactions((prev) => ({ ...prev, [itemId]: result.data }))
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las transacciones",
          variant: "destructive",
        })
      } finally {
        setLoading((prev) => ({ ...prev, [itemId]: false }))
      }
    },
    [transactions, toast],
  )

  const handleEdit = (product: InventoryItem) => {
    setSelectedProduct(product)
    setEditFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      basePrice: product.basePrice.toString(),
      costPrice: product.costPrice?.toString() || "",
      currentStock: product.currentStock.toString(),
      minimumStock: product.minimumStock.toString(),
      type: product.type,
      status: product.status,
      allowPresale: product.allowPresale,
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: InventoryItem) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setIsUpdating(true)
    try {
      const result = await updateInventoryItem(selectedProduct.id, {
        name: editFormData.name,
        sku: editFormData.sku,
        description: editFormData.description,
        basePrice: parseFloat(editFormData.basePrice),
        costPrice: editFormData.costPrice ? parseFloat(editFormData.costPrice) : undefined,
        currentStock: parseInt(editFormData.currentStock),
        minimumStock: parseInt(editFormData.minimumStock),
        type: editFormData.type,
        status: editFormData.status,
        allowPresale: editFormData.allowPresale,
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        })
        setIsEditDialogOpen(false)
        if (onItemUpdated) onItemUpdated()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el producto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return

    setIsUpdating(true)
    try {
      const result = await deleteInventoryItem(selectedProduct.id, deleteAuthCode)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Producto eliminado correctamente",
        })
        setIsDeleteDialogOpen(false)
        setDeleteAuthCode("")
        if (onItemUpdated) onItemUpdated()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
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

  // Safely count pre-sale items
  const preSaleCount = Array.isArray(items) ? items.filter((item) => item.allowPresale === true).length : 0

  useEffect(() => {
    const handleInventoryUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("Inventario actualizado:", customEvent.detail)

      if (onItemUpdated) {
        onItemUpdated()
      }
    }

    window.addEventListener("inventory-updated", handleInventoryUpdated)

    return () => {
      window.removeEventListener("inventory-updated", handleInventoryUpdated)
    }
  }, [onItemUpdated])

  const handlePreSaleToggle = async (id: string, currentValue: boolean) => {
    if (isUpdating) return

    try {
      setIsUpdating(true)
      const result = await updatePreSaleFlag(id, !currentValue)

      if (result.success) {
        const updatedItems = filteredItems.map((item) =>
          item.id === id ? { ...item, allowPresale: !currentValue } : item,
        )

        setFilteredItems(updatedItems)

        toast({
          title: !currentValue ? "Pre-venta habilitada" : "Pre-venta deshabilitada",
          description: !currentValue
            ? "Ahora se puede vender este producto sin stock disponible"
            : "Este producto ahora requiere stock disponible para venderse",
        })

        window.dispatchEvent(
          new CustomEvent("inventory-updated", {
            detail: { itemId: id, allowPresale: !currentValue },
          }),
        )

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
    } catch (error) {
      console.error("Error toggling pre-sale:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la configuración de pre-venta",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Filter items when showPreSaleOnly or items change
  useEffect(() => {
    // Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : []

    if (showPreSaleOnly) {
      // Filter items with allowPresale set to true
      setFilteredItems(safeItems.filter((item) => item.allowPresale === true))
    } else {
      setFilteredItems(safeItems)
    }
  }, [items, showPreSaleOnly])

  const table = useReactTable({
    data: filteredItems,
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
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2 shrink-0">
            <Package className="w-4 h-4" />
            Agregar Producto
          </Button>
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
                      className={`relative group hover:bg-muted/50 ${
                        row.original.allowPresale ? "bg-red-50/30 dark:bg-red-900/10" : ""
                      }`}
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
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(row.original)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePreSaleToggle(row.original.id, row.original.allowPresale)}
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              {row.original.allowPresale ? "Deshabilitar pre-venta" : "Habilitar pre-venta"}
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
                                <TransactionHistory
                                  transactions={transactions[row.original.id]}
                                  itemId={row.original.id}
                                />
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
            {filteredItems.length} producto(s) en total
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Producto
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del producto. Los cambios se guardarán automáticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={editFormData.sku}
                  onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Precio Base</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={editFormData.basePrice}
                  onChange={(e) => setEditFormData({ ...editFormData, basePrice: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Precio de Costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={editFormData.costPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Stock Actual</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={editFormData.currentStock}
                  onChange={(e) => setEditFormData({ ...editFormData, currentStock: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Stock Mínimo</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  value={editFormData.minimumStock}
                  onChange={(e) => setEditFormData({ ...editFormData, minimumStock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowPresale"
                checked={editFormData.allowPresale}
                onChange={(e) => setEditFormData({ ...editFormData, allowPresale: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="allowPresale">Permitir Pre-venta</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Producto
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Si el producto tiene transacciones asociadas, se desactivará en lugar de
              eliminarse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-sm text-red-700">
                ¿Estás seguro de que deseas eliminar el producto "{selectedProduct?.name}"?
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="authCode">Código de autorización (1234)</Label>
              <Input
                id="authCode"
                type="password"
                value={deleteAuthCode}
                onChange={(e) => setDeleteAuthCode(e.target.value)}
                placeholder="Ingresa el código de autorización"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={isUpdating || !deleteAuthCode}
            >
              {isUpdating ? "Eliminando..." : "Eliminar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onProductAdded={onItemUpdated} />
    </div>
  )
}