"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Plus, Minus, ShoppingCart, Tag, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import type { InventoryItem } from "./types"
import { formatCurrency } from "@/lib/utils"
import { bundleSchema } from "@/features/inventory/validation"
import { cn } from "@/lib/utils"

interface BundleFormProps {
  categoryId: string
  items: InventoryItem[]
  onSubmit: (data: any) => Promise<void>
}

export function BundleForm({ categoryId, items: initialItems, onSubmit }: BundleFormProps) {
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { quantity: number; overridePrice?: number }
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const safeItems = Array.isArray(initialItems) ? initialItems : []

  const form = useForm({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId,
      items: [],
      totalBasePrice: 0,
      savingsPercentage: 0,
    },
  })

  const totalBasePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    const item = safeItems.find((i) => i.id === itemId)
    return acc + (item?.basePrice || 0) * data.quantity
  }, 0)

  const totalOverridePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    return acc + (data.overridePrice || 0) * data.quantity
  }, 0)

  const savings = totalBasePrice - totalOverridePrice
  const savingsPercentage = totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const bundleData = {
        ...formData,
        items: Object.entries(selectedItems).map(([itemId, data]) => ({
          itemId,
          quantity: data.quantity,
          overridePrice: data.overridePrice,
        })),
        totalBasePrice,
        savingsPercentage: totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0,
      }
      await onSubmit(bundleData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ItemSelector = ({
    items,
    onSelect,
  }: {
    items: InventoryItem[]
    onSelect: (item: InventoryItem) => void
  }) => {
    const [open, setOpen] = useState(false)
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 hover:bg-muted/50 transition-colors">
            <Plus className="w-4 h-4" />
            Selecciona un artículo para agregar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Buscar artículos..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>No se encontraron artículos.</p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onSelect(item)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{formatCurrency(item.basePrice)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Nombre del Bundle
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="transition-all focus:ring-2 focus:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Artículos del Bundle
          </h3>

          <ItemSelector
            items={safeItems.filter((item) => !selectedItems[item.id])}
            onSelect={(item) => {
              setSelectedItems((prev) => ({
                ...prev,
                [item.id]: { quantity: 1 },
              }))
            }}
          />

          <AnimatePresence>
            <div className="space-y-4 mt-6">
              {Object.keys(selectedItems).map((itemId) => {
                const item = safeItems.find((i) => i.id === itemId)
                if (!item) return null
                const itemData = selectedItems[item.id]

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative flex items-center gap-4 p-4 border rounded-lg bg-muted group hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Precio base: {formatCurrency(item.basePrice)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1 rounded-full hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            const currentQty = itemData?.quantity || 0
                            if (currentQty > 1) {
                              setSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], quantity: currentQty - 1 },
                              }))
                            }
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={itemData?.quantity || ""}
                          onChange={(e) => {
                            const qty = Number.parseInt(e.target.value)
                            if (qty > 0) {
                              setSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], quantity: qty },
                              }))
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="p-1 rounded-full hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            const currentQty = itemData?.quantity || 0
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], quantity: currentQty + 1 },
                            }))
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="Precio personalizado"
                          value={itemData?.overridePrice || ""}
                          onChange={(e) => {
                            const price = Number.parseFloat(e.target.value)
                            if (price >= 0) {
                              setSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], overridePrice: price },
                              }))
                            }
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedItems((prev) => {
                          const { [item.id]: _, ...rest } = prev
                          return rest
                        })
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/70" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-muted p-6 rounded-lg border"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Precio base total:</p>
              <p className="font-semibold text-lg text-foreground">{formatCurrency(totalBasePrice)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Precio del bundle:</p>
              <p className="font-semibold text-lg text-foreground">{formatCurrency(totalOverridePrice)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Ahorro total:</p>
              <p className="font-semibold text-lg text-green-600 dark:text-green-400">{formatCurrency(savings)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Porcentaje de ahorro:</p>
              <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                {savingsPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex justify-end"
        >
          <Button
            type="submit"
            className={cn(
              "px-8 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            disabled={isSubmitting || Object.keys(selectedItems).length === 0}
          >
            {isSubmitting ? "Creando Bundle..." : "Crear Bundle"}
          </Button>
        </motion.div>
      </form>
    </Form>
  )
}

