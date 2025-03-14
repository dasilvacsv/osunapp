"use client"

import { useState, useCallback, useEffect } from "react"
import { InventoryTable } from "./table/inventory-table"
import { getInventoryItems } from "./actions"
import type { InventoryManagerProps } from "./types"
import { useToast } from "@/hooks/use-toast"

export function InventoryManager({ initialData }: InventoryManagerProps) {
  const [items, setItems] = useState(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
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
      console.error("Refresh error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al refrescar los datos del inventario.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast, isRefreshing])

  // Escuchar eventos de actualización de inventario
  useEffect(() => {
    const handleInventoryUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      const itemId = customEvent.detail?.itemId

      // Si tenemos un ID específico, actualizar solo ese elemento
      if (itemId && items.some((item) => item.id === itemId)) {
        refreshData()
      }
    }

    window.addEventListener("inventory-updated", handleInventoryUpdated)

    return () => {
      window.removeEventListener("inventory-updated", handleInventoryUpdated)
    }
  }, [refreshData, items])

  return (
    <div className="space-y-4">
      <InventoryTable items={items} onItemDisabled={refreshData} onItemUpdated={refreshData} />
    </div>
  )
}

