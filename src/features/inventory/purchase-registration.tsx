"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { DollarSign, Plus, Minus, Trash2, Save, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { z } from "zod"
import { InventoryItemSelector } from "./inventory-item-selector"
import type { InventoryItem } from "./types"
import { registerPurchase } from "./actions"

// Define the purchase schema
const purchaseItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
})

const purchaseSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  notes: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
})

interface PurchaseRegistrationProps {
  items: InventoryItem[]
  onPurchaseRegistered: () => void
}

export function PurchaseRegistration({ items, onPurchaseRegistered }: PurchaseRegistrationProps) {
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      item: InventoryItem
      quantity: number
      unitCost: number
    }>
  >([])
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierName: "",
      notes: "",
      invoiceNumber: "",
    },
  })

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
        unitCost: Number(item.basePrice) || 0, // Conversión explícita a número
      },
    ])
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newItems = [...selectedItems]
    newItems[index].quantity = newQuantity
    setSelectedItems(newItems)
  }

  const handleCostChange = (index: number, newCost: string) => {
    const numericValue = parseFloat(newCost) || 0
    const newItems = [...selectedItems]
    newItems[index].unitCost = numericValue
    setSelectedItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: any) => {
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

      console.log("Submitting purchase data:", purchaseData)

      // Call the server action
      const result = await registerPurchase(purchaseData)

      if (result.success) {
        toast({
          title: "Compra registrada",
          description: "La compra ha sido registrada exitosamente.",
        })
        form.reset()
        setSelectedItems([])
        onPurchaseRegistered()
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

  const totalCost = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Proveedor
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del proveedor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Número de Factura
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Opcional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Información adicional de la compra" className="resize-none" />
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
                              min={0}
                              step={0.01}
                              value={selectedItem.unitCost}
                              onChange={(e) => handleCostChange(index, e.target.value)} // Envía el string
                              className="w-32"
                              placeholder="Costo unitario"
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
                              min={0}
                              step={0.01}
                              value={selectedItem.unitCost}
                              onChange={(e) => handleCostChange(index, Number.parseFloat(e.target.value) || 0)}
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
                    <div className="font-bold text-lg">{formatCurrency(totalCost)}</div>
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
    </div>
  )
}

