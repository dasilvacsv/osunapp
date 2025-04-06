"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInventoryItem } from "./actions"
import { inventoryItemTypeEnum, inventoryItemStatusEnum } from "@/db/schema"
import { motion, AnimatePresence } from "framer-motion"
import { Package, DollarSign, Archive, Boxes, AlertCircle, Warehouse, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const typeTranslations: Record<string, string> = {
  PHYSICAL: "Físico",
  DIGITAL: "Digital",
  SERVICE: "Servicio",
}

const statusTranslations: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
}

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductAdded: () => void
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [type, setType] = useState(inventoryItemTypeEnum.enumValues[0])
  const [basePrice, setBasePrice] = useState("")
  const [costPrice, setCostPrice] = useState("") // Nuevo campo para precio de costo
  const [currentStock, setCurrentStock] = useState("")
  const [reservedStock, setReservedStock] = useState("")
  const [minimumStock, setMinimumStock] = useState("")
  const [status, setStatus] = useState(inventoryItemStatusEnum.enumValues[0])
  const [loading, setLoading] = useState(false)
  const [hasInitialInventory, setHasInitialInventory] = useState(false)
  const [initialCost, setInitialCost] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()

  const generateSKU = () => {
    const typePrefix = type.substring(0, 2).toUpperCase()
    const year = new Date().getFullYear().toString().slice(-2)
    const random = Math.floor(1000 + Math.random() * 9000) // 4-digit number
    return `${typePrefix}${year}-${random}`
  }

  // Generate SKU when type changes or component mounts
  useEffect(() => {
    setSku(generateSKU())
  }, [type])

  // Calcular margen de ganancia
  const profitMargin =
    basePrice && costPrice ? (((Number(basePrice) - Number(costPrice)) / Number(basePrice)) * 100).toFixed(2) : ""

  const resetForm = () => {
    setName("")
    setSku("")
    setType(inventoryItemTypeEnum.enumValues[0])
    setBasePrice("")
    setCostPrice("")
    setCurrentStock("")
    setReservedStock("")
    setMinimumStock("")
    setStatus(inventoryItemStatusEnum.enumValues[0])
    setHasInitialInventory(false)
    setInitialCost("")
    setDescription("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const stockValue = currentStock === "" ? 0 : Number.parseInt(currentStock)

      const result = await createInventoryItem({
        name,
        sku,
        type,
        basePrice: Number.parseFloat(basePrice),
        costPrice: costPrice ? Number.parseFloat(costPrice) : undefined, // Incluir precio de costo
        currentStock: stockValue,
        reservedStock: Number.parseInt(reservedStock) || 0,
        minimumStock: Number.parseInt(minimumStock) || 0,
        status,
        description,
        // If we have initial inventory, pass the cost for proper inventory tracking
        initialInventoryCost: hasInitialInventory && initialCost ? Number.parseFloat(initialCost) : undefined,
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Producto agregado exitosamente",
          duration: 3000,
        })
        onProductAdded()
        onOpenChange(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            Agregar Nuevo Producto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Información Básica
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Inventario
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <motion.div
                className="grid gap-6 py-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      Nombre
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-gray-500" />
                      SKU (Auto-generado)
                    </Label>
                    <Input 
                      id="sku" 
                      value={sku} 
                      className="w-full bg-muted/50" 
                      readOnly 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-gray-500" />
                      Tipo
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo">
                          {type ? typeTranslations[type] : "Seleccionar tipo"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <AnimatePresence>
                          {inventoryItemTypeEnum.enumValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {typeTranslations[value]}
                            </SelectItem>
                          ))}
                        </AnimatePresence>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Precio Base (Venta)
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                {/* Nuevo campo para precio de costo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-gray-500" />
                      Precio de Costo
                    </Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full"
                      placeholder="Costo de adquisición"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitMargin" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Margen de Ganancia
                    </Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                      {profitMargin ? `${profitMargin}%` : "Ingrese precio base y costo"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    Descripción
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full"
                    placeholder="Descripción del producto (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    Estado
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado">
                        {status ? statusTranslations[status] : "Seleccionar estado"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <AnimatePresence>
                        {inventoryItemStatusEnum.enumValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {statusTranslations[value]}
                          </SelectItem>
                        ))}
                      </AnimatePresence>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <motion.div
                className="grid gap-6 py-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="hasInitialInventory"
                    checked={hasInitialInventory}
                    onCheckedChange={(checked) => setHasInitialInventory(checked as boolean)}
                  />
                  <Label
                    htmlFor="hasInitialInventory"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Este producto ya tiene inventario inicial
                  </Label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock" className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-gray-500" />
                      Stock Actual
                    </Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                      className="w-full"
                      placeholder="Dejar vacío para 0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservedStock" className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      Reservado
                    </Label>
                    <Input
                      id="reservedStock"
                      type="number"
                      min="0"
                      value={reservedStock}
                      onChange={(e) => setReservedStock(e.target.value)}
                      className="w-full"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumStock" className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      Stock Mínimo
                    </Label>
                    <Input
                      id="minimumStock"
                      type="number"
                      min="0"
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(e.target.value)}
                      className="w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                {hasInitialInventory && currentStock !== "" && Number(currentStock) > 0 && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="initialCost" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Costo Inicial por Unidad
                    </Label>
                    <Input
                      id="initialCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={initialCost}
                      onChange={(e) => setInitialCost(e.target.value)}
                      className="w-full"
                      placeholder="Costo por unidad del inventario inicial"
                      required={hasInitialInventory && currentStock !== "" && Number(currentStock) > 0}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Esto se utilizará para rastrear el costo de tu inventario inicial.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="relative">
              {loading ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </motion.div>
              ) : (
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Agregar Producto
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

