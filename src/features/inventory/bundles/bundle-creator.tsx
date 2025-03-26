"use client"

// Add currency type selection to the form
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
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { InventoryItemSelector } from "../stock/inventory-item-selector"
import type { InventoryItem, BundleItem } from "../types"
import { getInventoryItems } from "../actions"
import { createBundle } from "./actions"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { getBCVRate } from "@/lib/exchangeRates"

// Schema for bundle
const bundleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  savingsPercentage: z.coerce.number().min(0).max(100),
  currencyType: z.enum(["USD", "BS"]).default("USD"),
  conversionRate: z.coerce.number().optional(),
})

type BundleFormValues = z.infer<typeof bundleSchema>

interface BundleCreatorProps {
  categories: { id: string; name: string }[]
  onBundleCreated?: () => void
}

export function BundleCreator({ categories, onBundleCreated }: BundleCreatorProps) {
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [bcvRate, setBcvRate] = useState<number>(35)
  const { toast } = useToast()
  const router = useRouter()

  // Calculations
  const totalBasePrice = selectedItems.reduce(
    (sum, item) => sum + (item.overridePrice || Number(item.item.basePrice)) * item.quantity,
    0,
  )

  const totalCostPrice = selectedItems.reduce(
    (sum, item) => sum + (Number(item.item.costPrice) || 0) * item.quantity,
    0,
  )

  // Form for bundle
  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      savingsPercentage: 0,
      currencyType: "USD",
      conversionRate: undefined,
    },
  })

  const savingsPercentage = form.watch("savingsPercentage")
  const currencyType = form.watch("currencyType")
  const conversionRate = form.watch("conversionRate")

  const discountedPrice = totalBasePrice * (1 - savingsPercentage / 100)
  const savings = totalBasePrice - discountedPrice

  // Calculate profit
  const profit = discountedPrice - totalCostPrice
  const profitPercentage = discountedPrice > 0 ? (profit / discountedPrice) * 100 : 0

  // Load BCV rate on mount and when currency changes
  useEffect(() => {
    if (currencyType === "BS") {
      fetchBCVRate()
    }
  }, [currencyType])

  // Fetch BCV rate
  const fetchBCVRate = async () => {
    try {
      setIsLoadingRate(true)
      const rateInfo = await getBCVRate()
      setBcvRate(rateInfo.rate)

      // Set the conversion rate if not already set
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

  // Handle item selection
  const handleItemSelect = (item: InventoryItem) => {
    // Check if item is already in the list
    if (selectedItems.some((i) => i.item.id === item.id)) {
      toast({
        title: "Item ya agregado",
        description: "Este artículo ya está en el bundle.",
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
        overridePrice: undefined,
        costPrice: Number(item.costPrice) || undefined,
      },
    ])
  }

  // Handle quantity change for bundle items
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newItems = [...selectedItems]
    newItems[index].quantity = newQuantity
    setSelectedItems(newItems)
  }

  // Handle override price change for bundle items
  const handlePriceChange = (index: number, newPrice: string) => {
    const numericValue = newPrice === "" ? undefined : Number.parseFloat(newPrice)
    const newItems = [...selectedItems]
    newItems[index].overridePrice = numericValue
    setSelectedItems(newItems)
  }

  // Remove item from bundle
  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  // Format currency based on type
  const formatBundleCurrency = (amount: number) => {
    if (currencyType === "BS") {
      const rate = conversionRate || bcvRate
      const bsAmount = amount * rate
      return `${bsAmount.toFixed(2)} Bs`
    }
    return formatCurrency(amount)
  }

  // Submit bundle
  const handleSubmit = async (values: BundleFormValues) => {
    try {
      if (selectedItems.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos un artículo para el bundle",
          variant: "destructive",
        })
        return
      }

      // Validate conversion rate for BS currency
      if (values.currencyType === "BS" && !values.conversionRate) {
        toast({
          title: "Error",
          description: "Debe especificar una tasa de conversión para bundles en Bolívares",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Transform the data for the API
      const bundleData = {
        name: values.name,
        description: values.description || "",
        categoryId: values.categoryId,
        items: selectedItems.map((item) => ({
          itemId: item.item.id,
          quantity: item.quantity,
          overridePrice: item.overridePrice,
        })),
        totalBasePrice,
        totalCostPrice,
        savingsPercentage: values.savingsPercentage,
        currencyType: values.currencyType,
        conversionRate: values.conversionRate,
      }

      // Llamar a la acción del servidor para crear el bundle
      const result = await createBundle(bundleData)

      if (result.success) {
        toast({
          title: "Bundle creado",
          description: "El bundle ha sido creado exitosamente.",
        })

        form.reset()
        setSelectedItems([])

        // Refrescar la página para mostrar el nuevo bundle
        router.refresh()

        if (onBundleCreated) {
          onBundleCreated()
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el bundle.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating bundle:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el bundle.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load inventory items on mount
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
                Información del Bundle
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
                        <Input {...field} id="name" name="name" placeholder="Nombre del bundle" />
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="description"
                        name="description"
                        placeholder="Descripción del bundle"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency Settings */}
              <div className="grid md:grid-cols-2 gap-6">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Artículos del Bundle
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
                                id={`overridePrice-${selectedItem.item.id}`}
                                name={`overridePrice-${selectedItem.item.id}`}
                                value={selectedItem.overridePrice !== undefined ? selectedItem.overridePrice : ""}
                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                className="w-32"
                                placeholder={`Precio (${formatCurrency(Number(selectedItem.item.basePrice))})`}
                              />
                            </div>

                            <div className="text-right font-medium">
                              {formatBundleCurrency(
                                (selectedItem.overridePrice !== undefined
                                  ? selectedItem.overridePrice
                                  : Number(selectedItem.item.basePrice)) * selectedItem.quantity,
                              )}
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
                              <span className="text-muted-foreground">Precio Base Total:</span>
                              <span className="font-medium">{formatBundleCurrency(totalBasePrice)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Costo Total:</span>
                              <span className="font-medium">{formatBundleCurrency(totalCostPrice)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Margen Bruto:</span>
                              <span className="font-medium">
                                {formatBundleCurrency(totalBasePrice - totalCostPrice)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">% Margen Bruto:</span>
                              <span className="font-medium">
                                {totalBasePrice > 0
                                  ? (((totalBasePrice - totalCostPrice) / totalBasePrice) * 100).toFixed(2)
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="savingsPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    Porcentaje de Descuento
                                  </FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <span>%</span>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Ahorro:</span>
                              <span className="font-medium">{formatBundleCurrency(savings)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Precio Final:</span>
                              <span className="font-bold text-lg text-primary">
                                {formatBundleCurrency(discountedPrice)}
                              </span>
                            </div>

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
                Crear Bundle
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

