"use client"

import { useState, useCallback, useEffect } from "react"
import { InventoryTable } from "./table/inventory-table"
import { getInventoryItems } from "./actions"
import type { InventoryManagerProps } from "./types"
import { useToast } from "@/hooks/use-toast"
import { AddProductDialog } from "./add-product-dialog"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"

export function InventoryManager({ initialData }: InventoryManagerProps) {
  console.log("initialData", initialData);
  
  const [items, setItems] = useState(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const refreshData = useCallback(async () => {
    if (isRefreshing) return

    try {
      setIsRefreshing(true)
      const result = await getInventoryItems()
      if (result.success && result.data) {
        setItems(result.data)
      }
    } catch (error) {
      console.error("Error de actualización:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al refrescar los datos del inventario.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast, isRefreshing])

  // Reemplazar el useEffect para escuchar eventos
  useEffect(() => {
    const handleInventoryUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("Inventario actualizado:", customEvent.detail)

      // Siempre actualizar la tabla completa cuando se recibe el evento
      refreshData()
    }

    window.addEventListener("inventory-updated", handleInventoryUpdated)

    return () => {
      window.removeEventListener("inventory-updated", handleInventoryUpdated)
    }
  }, [refreshData])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Add Product
        </Button>
      </div>
      
      <InventoryTable items={items} onItemDisabled={refreshData} onItemUpdated={refreshData} />
      
      <AddProductDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onProductAdded={refreshData}
      />
    </div>
  )
}

