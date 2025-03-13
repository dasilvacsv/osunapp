"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
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
      console.log("Creating product with data:", data)
      toast({
        title: "Not implemented",
        description: "Product creation will be implemented soon",
      })
    } catch (error) {
      console.error("Failed to create product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create product"
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
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          {/* TODO: Add ProductForm component here */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Product creation form will be implemented soon.</p>
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
              placeholder={loading ? "Loading products..." : "Select a product"}
              disabled={loading}
              emptyMessage="No products found"
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