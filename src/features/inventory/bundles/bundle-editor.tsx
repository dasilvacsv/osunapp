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
  Tag,
  ShoppingBag,
  Coins,
  RefreshCw,
  Building,
  FileText,
  List,
  Loader2,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { InventoryItemSelector } from "../stock/inventory-item-selector"
import type { InventoryItem, BundleItem } from "../types"
import { getInventoryItems } from "../actions"
import { getBundleById, updateBundle, createInventoryTransaction } from "./actions"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { getBCVRate } from "@/lib/exchangeRates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createBundleCategory } from "./actions"
import { OrganizationCombobox } from "@/components/organization-combobox"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
})

const bundleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  basePrice: z.coerce.number().min(0, "El precio base debe ser mayor o igual a 0"),
  margin: z.coerce.number().min(0, "El margen debe ser mayor o igual a 0").default(5),
  currencyType: z.enum(["USD", "BS"]).default("USD"),
  conversionRate: z.coerce.number().optional(),
  organizationId: z.string().optional(),
})

type BundleFormValues = z.infer<typeof bundleSchema>
type CategoryFormValues = z.infer<typeof categorySchema>

interface BundleEditorProps {
  bundleId: string
  categories: { id: string; name: string }[]
  organizations: { id: string; name: string }[]
  onBundleUpdated?: () => void
}

export function BundleEditor({ bundleId, categories, organizations, onBundleUpdated }: BundleEditorProps) {
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [bcvRate, setBcvRate] = useState<number>(35)
  const [originalItems, setOriginalItems] = useState<BundleItem[]>([])
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
      margin: 5,
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

  // El precio de venta es igual al precio base
  const salePrice = basePrice

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

  // Cálculo de la ganancia real (puede ser diferente del margen esperado)
  const profit = salePrice - totalCostPrice
  const profitPercentage = totalCostPrice > 0 ? (profit / totalCostPrice) * 100 : 0

  // Cargar datos del paquete
  useEffect(() => {
    const loadBundle = async () => {
      try {
        setIsLoading(true)
        const result = await getBundleById(bundleId)

        if (result.success && result.data) {
          const bundle = result.data

          // Establecer valores del formulario
          form.reset({
            name: bundle.name,
            description: bundle.description || "",
            notes: bundle.notes || "",
            categoryId: bundle.categoryId,
            basePrice: Number(bundle.basePrice),
            margin: Number(bundle.discountPercentage || 0),
            currencyType: (bundle.currencyType as "USD" | "BS") || "USD",
            conversionRate: bundle.conversionRate ? Number(bundle.conversionRate) : undefined,
            organizationId: bundle.organizationId || undefined,
          })

          // Establecer items seleccionados
          setSelectedItems(bundle.items)
          setOriginalItems(bundle.items)
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo cargar el paquete",
            variant: "destructive",
          })
          router.push("/inventario/bundles")
        }
      } catch (error) {
        console.error("Error loading bundle:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar el paquete",
          variant: "destructive",
        })
        router.push("/inventario/bundles")
      } finally {
        setIsLoading(false)
      }
    }

    loadBundle()
    refreshInventory()
  }, [bundleId, form, router, toast])

  useEffect(() => {
    if (currencyType === "BS" && form.getValues("basePrice") === 0) {
      fetchBCVRate()
    }
  }, [currencyType, form])

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
      // Si estamos en modo BS, mostramos directamente el monto en Bs sin conversión
      return `${amount.toFixed(2)} Bs`
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

      // Solo requerimos tasa de conversión si estamos usando BS con cálculos basados en USD
      // Para precios directos en BS, no necesitamos una tasa de conversión
      if (values.currencyType === "USD" || values.basePrice > 0) {
        // No necesitamos validar la tasa de conversión aquí
      } else if (values.currencyType === "BS" && values.basePrice === 0 && !values.conversionRate) {
        toast({
          title: "Error",
          description: "Debe especificar una tasa de conversión para cálculos basados en USD",
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

      const result = await updateBundle(bundleId, bundleData)

      if (result.success) {
        // Crear transacciones de inventario para los cambios en los ítems
        // Primero, identificar los ítems que se han agregado o modificado
        const itemChanges = calculateItemChanges(originalItems, selectedItems)

        // Procesar cada cambio de inventario
        for (const change of itemChanges) {
          await createInventoryTransaction({
            itemId: change.itemId,
            quantity: change.quantityChange, // Puede ser positivo (devolución) o negativo (retiro)
            transactionType: change.quantityChange > 0 ? "IN" : "OUT",
            reference: {
              type: "BUNDLE_UPDATE",
              bundleId: bundleId,
              bundleName: values.name,
            },
            notes: `Actualización de ítem en paquete: ${values.name}`,
          })
        }

        toast({
          title: "Paquete actualizado",
          description: "El paquete ha sido actualizado exitosamente y el inventario ha sido ajustado.",
        })

        // Actualizar los items originales para futuras comparaciones
        setOriginalItems([...selectedItems])

        if (onBundleUpdated) onBundleUpdated()
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el paquete.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating bundle:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el paquete.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para calcular los cambios en los ítems
  const calculateItemChanges = (originalItems: BundleItem[], newItems: BundleItem[]) => {
    const changes: { itemId: string; quantityChange: number }[] = []

    // Verificar ítems eliminados o con cantidad reducida
    for (const originalItem of originalItems) {
      const newItem = newItems.find((item) => item.itemId === originalItem.itemId)

      if (!newItem) {
        // Ítem eliminado, devolver al inventario
        changes.push({
          itemId: originalItem.itemId,
          quantityChange: originalItem.quantity, // Positivo porque se devuelve al inventario
        })
      } else if (newItem.quantity < originalItem.quantity) {
        // Cantidad reducida, devolver la diferencia al inventario
        changes.push({
          itemId: originalItem.itemId,
          quantityChange: originalItem.quantity - newItem.quantity, // Positivo porque se devuelve al inventario
        })
      }
    }

    // Verificar ítems nuevos o con cantidad aumentada
    for (const newItem of newItems) {
      const originalItem = originalItems.find((item) => item.itemId === newItem.itemId)

      if (!originalItem) {
        // Ítem nuevo, retirar del inventario
        changes.push({
          itemId: newItem.itemId,
          quantityChange: -newItem.quantity, // Negativo porque se retira del inventario
        })
      } else if (newItem.quantity > originalItem.quantity) {
        // Cantidad aumentada, retirar la diferencia del inventario
        changes.push({
          itemId: newItem.itemId,
          quantityChange: -(newItem.quantity - originalItem.quantity), // Negativo porque se retira del inventario
        })
      }
    }

    return changes
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando información del paquete...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Editar Paquete
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
                      <FormControl>
                        <OrganizationCombobox
                          organizations={organizations}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
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

                {/* Solo mostrar el campo de tasa de conversión si estamos en USD */}
                {currencyType === "USD" && (
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
                        Precio Base {currencyType === "BS" ? "(Bs)" : "($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder={`Precio base del paquete en ${currencyType === "BS" ? "Bolívares" : "Dólares"}`}
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
                        <DollarSign className="w-4 h-4" />
                        Ganancia Esperada {currencyType === "BS" ? "(Bs)" : "($)"}
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Ganancia esperada"
                          />
                        </FormControl>
                        {currencyType === "USD" ? <span>$</span> : <span>Bs</span>}
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
                        className="min-h-[100px] resize-vertical transition-all duration-200"
                        rows={4}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement
                          target.style.height = "auto"
                          target.style.height = `${Math.max(100, target.scrollHeight)}px`
                        }}
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
                        className="min-h-[80px] resize-vertical"
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
                              <span className="text-muted-foreground">Ganancia Esperada:</span>
                              <span className="font-medium">{formatBundleCurrency(margin)}</span>
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
                              <span className="text-muted-foreground">Ganancia Real:</span>
                              <span className={`font-medium ${profit < 0 ? "text-destructive" : "text-green-600"}`}>
                                {formatBundleCurrency(profit)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">% Ganancia sobre costo:</span>
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
                Actualizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
