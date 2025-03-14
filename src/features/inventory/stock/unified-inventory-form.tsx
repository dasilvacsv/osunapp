"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Package2,
  Plus,
  Minus,
  Save,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Trash2,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { InventoryItemSelector } from "./inventory-item-selector"
import type { InventoryItem } from "@/features/inventory/types"
import { registerPurchase, stockIn, stockOut } from "./actions"
import { getInventoryItems } from "../actions"

// Schema for stock adjustment
const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid("Debe seleccionar un producto"),
  quantity: z.number().int("La cantidad debe ser un número entero"),
  notes: z.string().optional(),
})

// Schema for purchase
const purchaseItemSchema = z.object({
  itemId: z.string().uuid("ID de artículo inválido"),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unitCost: z.coerce.number().nonnegative("El costo unitario no puede ser negativo"),
})

const purchaseSchema = z.object({
  supplierName: z.string().min(1, "El nombre del proveedor es requerido"),
  notes: z.string().optional(),
  invoiceNumber: z.string().optional(),
})

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
type PurchaseFormValues = z.infer<typeof purchaseSchema>

interface UnifiedInventoryFormProps {
  items: InventoryItem[]
}

export function UnifiedInventoryForm({ items }: UnifiedInventoryFormProps) {
  const [activeTab, setActiveTab] = useState<"purchase" | "adjustment">("purchase")
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      item: InventoryItem
      quantity: number
      unitCost: number
    }>
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(items || [])
  const { toast } = useToast()

  // Refresh inventory items
  const refreshInventory = async () => {
    try {
      const result = await getInventoryItems()
      if (result.success && result.data) {
        setInventoryItems(result.data)
      }
    } catch (error) {
      console.error("Error refreshing inventory:", error)
    }
  }

  // Form for stock adjustments
  const stockForm = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      itemId: "",
      quantity: 0,
      notes: "",
    },
  })

  // Form for purchases
  const purchaseForm = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierName: "",
      notes: "",
      invoiceNumber: "",
    },
  })

  // Selected item for stock adjustment
  const selectedAdjustmentItem = inventoryItems.find((item) => item.id === stockForm.watch("itemId"))

  // Handle item selection for purchase
  const handleItemSelect = (item: InventoryItem) => {
    // Check if item is already in the list
    if (selectedItems.some((i) => i.item.id === item.id)) {
      toast({
        title: "Item ya agregado",
        description: "Este artículo ya está en la lista de compra.",
        variant: "destructive",
      })
      return
    }

    setSelectedItems([
      ...selectedItems,
      {
        item,
        quantity: 1,
        unitCost: Number(item.basePrice) || 0,
      },
    ])
  }

  // Handle quantity change for purchase items
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newItems = [...selectedItems]
    newItems[index].quantity = newQuantity
    setSelectedItems(newItems)
  }

  // Handle cost change for purchase items
  const handleCostChange = (index: number, newCost: string) => {
    const numericValue = Number.parseFloat(newCost) || 0
    const newItems = [...selectedItems]
    newItems[index].unitCost = numericValue
    setSelectedItems(newItems)
  }

  // Remove item from purchase list
  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  // Submit stock adjustment
  const handleStockAdjustment = async (data: StockAdjustmentFormValues) => {
    try {
      setIsSubmitting(true)

      // Determine if it's a stock in or stock out based on quantity
      const result =
        data.quantity > 0
          ? await stockIn({
              itemId: data.itemId,
              quantity: data.quantity,
              notes: data.notes,
            })
          : await stockOut({
              itemId: data.itemId,
              quantity: Math.abs(data.quantity),
              notes: data.notes,
            })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "El stock se ha actualizado correctamente.",
        })
        stockForm.reset()
        refreshInventory()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el stock.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al ajustar el stock.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit purchase
  const handlePurchaseSubmit = async (values: PurchaseFormValues) => {
    try {
      if (selectedItems.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos un artículo",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Transform the data for the API
      const itemsData = selectedItems.map((item) => ({
        itemId: item.item.id,
        quantity: item.quantity,
        unitCost: item.unitCost,
      }))

      const purchaseData = {
        supplierName: values.supplierName,
        notes: values.notes || "",
        invoiceNumber: values.invoiceNumber || "",
        items: itemsData,
      }

      // Call the server action
      const result = await registerPurchase(purchaseData)

      if (result.success) {
        toast({
          title: "Compra registrada",
          description: "La compra ha sido registrada exitosamente.",
        })
        purchaseForm.reset()
        setSelectedItems([])
        refreshInventory()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar la compra.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error registering purchase:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la compra.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPurchaseCost = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

  // Load inventory items on mount
  useEffect(() => {
    if (!items || items.length === 0) {
      refreshInventory()
    }
  }, [items])

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="purchase"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "purchase" | "adjustment")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Registrar Compra
          </TabsTrigger>
          <TabsTrigger value="adjustment" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Ajustar Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-6 pt-4">
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit(handlePurchaseSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={purchaseForm.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Proveedor
                      </FormLabel>
                      <FormControl>
                        <Input {...field} id="supplierName" name="supplierName" placeholder="Nombre del proveedor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Número de Factura
                      </FormLabel>
                      <FormControl>
                        <Input {...field} id="invoiceNumber" name="invoiceNumber" placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="purchaseNotes"
                        name="purchaseNotes"
                        placeholder="Información adicional de la compra"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Artículos</h3>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-2/3">
                    <InventoryItemSelector onSelect={handleItemSelect} />
                  </div>
                </div>

                <AnimatePresence>
                  {selectedItems.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {selectedItems.map((selectedItem, index) => (
                        <Card key={selectedItem.item.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                              <div className="flex-1">
                                <h4 className="font-medium">{selectedItem.item.name}</h4>
                                <p className="text-sm text-muted-foreground">SKU: {selectedItem.item.sku}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(index, selectedItem.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  id={`quantity-${selectedItem.item.id}`}
                                  name={`quantity-${selectedItem.item.id}`}
                                  value={selectedItem.quantity}
                                  onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 1)}
                                  className="w-20 text-center"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(index, selectedItem.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  id={`unitCost-${selectedItem.item.id}`}
                                  name={`unitCost-${selectedItem.item.id}`}
                                  value={selectedItem.unitCost}
                                  onChange={(e) => handleCostChange(index, e.target.value)}
                                  className="w-32"
                                  placeholder="Costo unitario"
                                />
                              </div>

                              <div className="text-right font-medium">
                                {formatCurrency(selectedItem.quantity * selectedItem.unitCost)}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="flex justify-between pt-4 border-t">
                        <h4 className="font-medium">Total</h4>
                        <div className="font-bold text-lg">{formatCurrency(totalPurchaseCost)}</div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground text-center py-8"
                    >
                      No hay artículos seleccionados. Use el buscador para agregar productos.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Registrar Compra
                  </>
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="adjustment" className="space-y-6 pt-4">
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(handleStockAdjustment)} className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                <FormField
                  control={stockForm.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Seleccionar Producto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(inventoryItems) && inventoryItems.length > 0 ? (
                            inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id} className="flex items-center gap-2 py-3">
                                <Package2 className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    Stock actual: {item.currentStock}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No hay productos disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedAdjustmentItem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-lg bg-muted/50"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stock Actual:</span>
                        <span className="ml-2 font-medium">{selectedAdjustmentItem.currentStock}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock Mínimo:</span>
                        <span className="ml-2 font-medium">{selectedAdjustmentItem.minimumStock}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <FormField
                  control={stockForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Cantidad</FormLabel>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(Number(field.value) - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              id="adjustmentQuantity"
                              name="adjustmentQuantity"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="text-center h-12"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(Number(field.value) + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(10)}
                            className="flex items-center gap-1"
                          >
                            <ArrowUp className="h-3 w-3" /> +10
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(-10)}
                            className="flex items-center gap-1"
                          >
                            <ArrowDown className="h-3 w-3" /> -10
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          {field.value > 0 ? "Entrada de stock" : field.value < 0 ? "Salida de stock" : "Sin cambios"}
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Notas</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          id="adjustmentNotes"
                          name="adjustmentNotes"
                          placeholder="Razón del ajuste de stock"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => stockForm.reset()}
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <RefreshCw className="h-4 w-4" />
                  Limpiar
                </Button>
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={isSubmitting || !stockForm.watch("itemId") || stockForm.watch("quantity") === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {stockForm.watch("quantity") > 0 ? "Registrar Entrada" : "Registrar Salida"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

