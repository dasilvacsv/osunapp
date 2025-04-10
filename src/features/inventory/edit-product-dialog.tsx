"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateInventoryItem } from "./actions"
import { inventoryItemTypeEnum, inventoryItemStatusEnum } from "@/db/schema"
import { motion } from "framer-motion"
import { Package, DollarSign, Archive, Boxes, AlertCircle, Warehouse, Calculator, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InventoryItem } from "./types"

const typeTranslations: Record<string, string> = {
  PHYSICAL: "Físico",
  DIGITAL: "Digital",
  SERVICE: "Servicio",
}

const statusTranslations: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
}

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated: () => void
  product: InventoryItem | null
}

export function EditProductDialog({ open, onOpenChange, onProductUpdated, product }: EditProductDialogProps) {
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [type, setType] = useState<string>("")
  const [basePrice, setBasePrice] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [currentStock, setCurrentStock] = useState("")
  const [reservedStock, setReservedStock] = useState("")
  const [minimumStock, setMinimumStock] = useState("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [allowPresale, setAllowPresale] = useState(false)
  const { toast } = useToast()

  // Cargar datos del producto cuando cambia
  useEffect(() => {
    if (product) {
      setName(product.name || "")
      setSku(product.sku || "")
      setType(product.type || inventoryItemTypeEnum.enumValues[0])
      setBasePrice(product.basePrice ? product.basePrice.toString() : "")
      setCostPrice(product.costPrice ? product.costPrice.toString() : "")
      setCurrentStock(product.currentStock ? product.currentStock.toString() : "")
      setReservedStock(product.reservedStock ? product.reservedStock.toString() : "")
      setMinimumStock(product.minimumStock ? product.minimumStock.toString() : "")
      setStatus(product.status || inventoryItemStatusEnum.enumValues[0])
      setDescription(product.description || "")
      setAllowPresale(product.allowPresale || false)
    }
  }, [product])

  // Calcular margen de ganancia
  const profitMargin =
    basePrice && costPrice ? (((Number(basePrice) - Number(costPrice)) / Number(basePrice)) * 100).toFixed(2) : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)

    try {
      const result = await updateInventoryItem(product.id, {
        name,
        sku,
        type,
        basePrice: Number.parseFloat(basePrice),
        costPrice: costPrice ? Number.parseFloat(costPrice) : undefined,
        currentStock: Number.parseInt(currentStock),
        minimumStock: Number.parseInt(minimumStock),
        status,
        description,
        allowPresale,
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Producto actualizado exitosamente",
          duration: 3000,
        })
        onProductUpdated()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
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

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            Editar Producto
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
                      SKU
                    </Label>
                    <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full" required />
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
                        {inventoryItemTypeEnum.enumValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {typeTranslations[value]}
                          </SelectItem>
                        ))}
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
                      {inventoryItemStatusEnum.enumValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {statusTranslations[value]}
                        </SelectItem>
                      ))}
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
                    id="allowPresale"
                    checked={allowPresale}
                    onCheckedChange={(checked) => setAllowPresale(checked as boolean)}
                  />
                  <Label
                    htmlFor="allowPresale"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Permitir pre-venta (vender sin stock disponible)
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
                      disabled
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
                    />
                  </div>
                </div>
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
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
