"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Plus,
  Minus,
  Save,
  Trash2,
  DollarSign,
  Percent,
  Tag,
  ShoppingBag,
  Coins,
  RefreshCw,
  Building,
  FileText,
  List,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { InventoryItemSelector } from "../stock/inventory-item-selector"
import type { InventoryItem, BundleItem } from "../types"
import { getInventoryItems } from "../actions"
import { createBundle, createInventoryTransaction } from "./actions"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { getBCVRate } from "@/lib/exchangeRates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createBundleCategory } from "./actions"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
})

const bundleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  basePrice: z.coerce.number().min(0, "El precio base debe ser mayor o igual a 0"),
  margin: z.coerce.number().min(0).max(100).default(30),
  currencyType: z.enum(["USD", "BS"]).default("USD"),
  conversionRate: z.coerce.number().optional(),
  organizationId: z.string().optional(),
})

type BundleFormValues = z.infer<typeof bundleSchema>
type CategoryFormValues = z.infer<typeof categorySchema>

interface BundleCreatorProps {
  categories: { id: string; name: string }[]
  organizations: { id: string; name: string }[]
  onBundleCreated?: () => void
}

export function BundleCreator({ categories, organizations, onBundleCreated }: BundleCreatorProps) {
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [bcvRate, setBcvRate] = useState<number>(35)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      description: "",
      notes: "",
      categoryId: "",
      basePrice: 0,
      margin: 30,
      currencyType: "USD",
      conversionRate: undefined,
      organizationId: undefined,
    },
  })

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  })

  const basePrice = form.watch("basePrice")
  const margin = form.watch("margin")
  const currencyType = form.watch("currencyType")
  const conversionRate = form.watch("conversionRate")

  // Cálculo del precio de venta basado en el precio base y el margen
  const salePrice = basePrice * (1 + margin / 100)

  // Cálculo del costo estimado basado en los ítems seleccionados
  const totalCostPrice = selectedItems.reduce((sum, item) => {
    // Si el ítem tiene costPrice, lo usamos
    if (item.item.costPrice) {
      return sum + Number(item.item.costPrice) * item.quantity
    }
    // Si no tiene costPrice pero tiene basePrice y margin, calculamos el costo
    else if (item.item.basePrice && item.item.margin) {
      const basePrice = Number(item.item.basePrice)
      const margin = Number(item.item.margin)
      const estimatedCost = basePrice / (1 + margin)
      return sum + estimatedCost * item.quantity
    }
    // Si no tenemos información suficiente, asumimos costo 0
    return sum
  }, 0)

  // Cálculo de la ganancia
  const profit = salePrice - totalCostPrice
  const profitPercentage = salePrice > 0 ? (profit / salePrice) * 100 : 0

  useEffect(() => {
    if (currencyType === "BS") {
      fetchBCVRate()
    }
  }, [currencyType])

  const fetchBCVRate = async () => {
    try {
      setIsLoadingRate(true)
      const rateInfo = await getBCVRate()
      setBcvRate(rateInfo.rate)
      if (!conversionRate) {
        form.setValue("conversionRate", rateInfo.rate)
      }
      toast({
        title: "Tasa BCV actualizada",
        description: `Tasa actual: ${rateInfo.rate} Bs/USD (${rateInfo.isError ? "tasa de respaldo" : "actualizada"})`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })
    } catch (error) {
      console.error("Error fetching BCV rate:", error)
      toast({
        title: "Error",
        description: "No se pudo obtener la tasa BCV",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRate(false)
    }
  }

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

  const handleCreateCategory = async (values: CategoryFormValues) => {
    try {
      const result = await createBundleCategory({ name: values.name })
      if (result.success) {
        toast({
          title: "✅ Categoría creada",
          description: "La categoría ha sido creada exitosamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        router.refresh()
        categoryForm.reset()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear la categoría",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la categoría",
        variant: "destructive",
      })
    }
  }

  const handleItemSelect = (item: InventoryItem) => {
    if (selectedItems.some((i) => i.item.id === item.id)) {
      toast({
        title: "Item ya agregado",
        description: "Este artículo ya está en el paquete.",
        variant: "destructive",
      })
      return
    }

    setSelectedItems([
      ...selectedItems,
      {
        itemId: item.id,
        item,
        quantity: 1,
        costPrice: Number(item.costPrice) || undefined,
      },
    ])
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const newItems = [...selectedItems]
    newItems[index].quantity = newQuantity
    setSelectedItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const formatBundleCurrency = (amount: number) => {
    if (currencyType === "BS") {
      const rate = conversionRate || bcvRate
      const bsAmount = amount * rate
      return `${bsAmount.toFixed(2)} Bs`
    }
    return formatCurrency(amount)
  }

  // Genera la descripción automática como lista de ítems
  const generateItemsList = () => {
    if (selectedItems.length === 0) return ""

    return selectedItems.map((item) => `• ${item.quantity} x ${item.item.name}`).join("\n")
  }

  const handleSubmit = async (values: BundleFormValues) => {
    try {
      if (selectedItems.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos un artículo para el paquete",
          variant: "destructive",
        })
        return
      }

      if (values.currencyType === "BS" && !values.conversionRate) {
        toast({
          title: "Error",
          description: "Debe especificar una tasa de conversión para paquetes en Bolívares",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Preparar la descripción automática si no se ha proporcionado una
      if (!values.description || values.description.trim() === "") {
        const itemsList = generateItemsList()
        form.setValue("description", `Este paquete incluye:\n${itemsList}`)
        values.description = `Este paquete incluye:\n${itemsList}`
      }

      const bundleData = {
        ...values,
        items: selectedItems.map((item) => ({
          itemId: item.item.id,
          quantity: item.quantity,
        })),
        salePrice,
        totalCostPrice,
      }

      const result = await createBundle(bundleData)

      if (result.success) {
        // Crear transacciones de inventario para cada ítem
        for (const item of selectedItems) {
          await createInventoryTransaction({
            itemId: item.itemId,
            quantity: -item.quantity, // Negativo porque se está retirando del inventario
            transactionType: "OUT",
            reference: {
              type: "BUNDLE_CREATION",
              bundleId: result.data,
              bundleName: values.name,
            },
            notes: `Ítem asignado al paquete: ${values.name}`,
          })
        }

        toast({
          title: "Paquete creado",
          description: "El paquete ha sido creado exitosamente y los ítems han sido descontados del inventario.",
        })
        form.reset()
        setSelectedItems([])
        router.refresh()
        if (onBundleCreated) onBundleCreated()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el paquete.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating bundle:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el paquete.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    refreshInventory()
  }, [])

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información del Paquete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Nombre
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del paquete" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Categoría
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Crear Nueva Categoría</DialogTitle>
                            </DialogHeader>
                            <Form {...categoryForm}>
                              <form onSubmit={categoryForm.handleSubmit(handleCreateCategory)} className="space-y-4">
                                <FormField
                                  control={categoryForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nombre de la categoría</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Ej: Paquetes escolares" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit" className="w-full">
                                  Crear Categoría
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Organización (Opcional)
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar organización" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currencyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Moneda
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                          <SelectItem value="BS">Bolívares (BS)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currencyType === "BS" && (
                  <FormField
                    control={form.control}
                    name="conversionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Tasa de Cambio (Bs/USD)
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder={`Tasa BCV: ${bcvRate}`}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={fetchBCVRate}
                            disabled={isLoadingRate}
                          >
                            <RefreshCw className={`h-4 w-4 ${isLoadingRate ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Precio Base
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="Precio base del paquete"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="margin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Margen (%)
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Margen de ganancia"
                          />
                        </FormControl>
                        <span>%</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <List className="w-4 h-4" /> Descripción
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descripción del paquete (se generará automáticamente si se deja en blanco)"
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notas
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notas adicionales sobre el paquete"
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Artículos del Paquete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full">
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
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">Precio base:</span>
                                <span className="text-xs font-medium">
                                  {formatCurrency(Number(selectedItem.item.basePrice))}
                                </span>

                                {selectedItem.item.costPrice && (
                                  <>
                                    <span className="text-xs text-muted-foreground ml-2">Costo:</span>
                                    <span className="text-xs font-medium">
                                      {formatCurrency(Number(selectedItem.item.costPrice))}
                                    </span>
                                  </>
                                )}
                              </div>
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

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Costo Total:</span>
                              <span className="font-medium">{formatBundleCurrency(totalCostPrice)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Precio Base:</span>
                              <span className="font-medium">{formatBundleCurrency(basePrice)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Margen:</span>
                              <span className="font-medium">{margin}%</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Precio de Venta:</span>
                              <span className="font-bold text-lg text-primary">{formatBundleCurrency(salePrice)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Ganancia:</span>
                              <span className={`font-medium ${profit < 0 ? "text-destructive" : "text-green-600"}`}>
                                {formatBundleCurrency(profit)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">% Ganancia:</span>
                              <span
                                className={`font-medium ${profitPercentage < 0 ? "text-destructive" : "text-green-600"}`}
                              >
                                {profitPercentage.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Cantidad de Ítems:</span>
                              <span className="font-medium">{selectedItems.length} tipos</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Total Unidades:</span>
                              <span className="font-medium">
                                {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} unidades
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isSubmitting || selectedItems.length === 0}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Crear Paquete
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

