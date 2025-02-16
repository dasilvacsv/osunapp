"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInventoryItem } from "./actions"
import { inventoryItemTypeEnum, inventoryItemStatusEnum } from "@/db/schema"
import { motion, AnimatePresence } from "framer-motion"
import { Package, DollarSign, Archive, Boxes, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [currentStock, setCurrentStock] = useState("")
  const [reservedStock, setReservedStock] = useState("")
  const [minimumStock, setMinimumStock] = useState("")
  const [status, setStatus] = useState(inventoryItemStatusEnum.enumValues[0])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setName("")
    setSku("")
    setType(inventoryItemTypeEnum.enumValues[0])
    setBasePrice("")
    setCurrentStock("")
    setReservedStock("")
    setMinimumStock("")
    setStatus(inventoryItemStatusEnum.enumValues[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createInventoryItem({
        name,
        sku,
        type,
        basePrice: Number.parseFloat(basePrice),
        currentStock: Number.parseInt(currentStock),
        reservedStock: Number.parseInt(reservedStock),
        minimumStock: Number.parseInt(minimumStock),
        status,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added successfully",
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
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            Add New Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
                  Name
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
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-gray-500" />
                  Type
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <AnimatePresence>
                      {inventoryItemTypeEnum.enumValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </AnimatePresence>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  Base Price
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock" className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-gray-500" />
                  Current Stock
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservedStock" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  Reserved
                </Label>
                <Input
                  id="reservedStock"
                  type="number"
                  min="0"
                  value={reservedStock}
                  onChange={(e) => setReservedStock(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumStock" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  Min Stock
                </Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <AnimatePresence>
                    {inventoryItemStatusEnum.enumValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </AnimatePresence>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="relative"
            >
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
                  Add Product
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}