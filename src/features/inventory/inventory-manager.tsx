"use client"

import { useState } from "react"
import { InventoryTable } from "./table/inventory-table"
import { getInventoryItems } from "./actions"
import type { InventoryManagerProps } from "./types"
import { useToast } from "@/hooks/use-toast"

export function InventoryManager({ initialData }: InventoryManagerProps) {
  const [items, setItems] = useState(initialData)
  const { toast } = useToast()

  const refreshData = async () => {
    try {
      const result = await getInventoryItems()
      if (result.success && result.data) {
        setItems(result.data)
        toast({
          title: "Actualizado",
          description: "Los datos del inventario han sido actualizados.",
        })
      }
    } catch (error) {
      console.error("Refresh error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al refrescar los datos del inventario.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <InventoryTable 
        items={items} 
        onItemDisabled={refreshData}
        onItemUpdated={refreshData}
      />
    </div>
  )
} 