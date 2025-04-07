"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

export interface InventoryItem {
  id: string
  name: string
  currentStock: number
  basePrice: string
  status: "ACTIVE" | "INACTIVE" | null
  metadata: Record<string, any> | null
  sku?: string
  description?: string | null
}

interface ProductSelectProps {
  selectedProductId: string
  onProductSelect: (productId: string, product: InventoryItem) => void
  className?: string
  initialProducts: InventoryItem[]
}

export function ProductSelect({
  selectedProductId,
  onProductSelect,
  className,
  initialProducts
}: ProductSelectProps) {
  const { toast } = useToast()
  const [products, setProducts] = useState<InventoryItem[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Update products when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Handle product selection
  const handleProductChange = async (value: string) => {
    const selectedProduct = products.find(p => p.id === value)
    if (selectedProduct) {
      onProductSelect(value, selectedProduct)
    }
  }

  // Handle product creation
  const handleCreateProduct = async (data: any) => {
    try {
      // TODO: Implement product creation action
      console.log("Crear un nuevo producto:", data)
      toast({
        title: "No esta implementado",
        description: "La creación de productos estará disponible pronto",
      })
    } catch (error) {
      console.error("Hubo un fallo al crear el producto:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear producto"
      })
    }
  }

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent 
          className="sm:max-w-[500px]" 
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <DialogHeader>
            <DialogTitle>Crear nuevo producto</DialogTitle>
          </DialogHeader>
          {/* TODO: Add ProductForm component here */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground">El formulario de Creación de producto, estará implementado pronto...</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <PopoverSelect
              options={products.map(product => ({
                label: `${product.name} - Stock: ${product.currentStock} - ${formatCurrency(Number(product.basePrice))}`,
                value: product.id,
                data: product
              }))}
              value={selectedProductId}
              onValueChange={handleProductChange}
              placeholder={loading ? "Cargando productos..." : "Selecciona un producto"}
              disabled={loading}
              emptyMessage="No se encontraron productos"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
} 