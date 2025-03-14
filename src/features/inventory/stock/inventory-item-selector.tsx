// components/inventory-item-selector.tsx
"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { formatCurrency } from "@/lib/utils"
import { searchInventory } from "./actions"
import type { InventoryItem } from "@/features/inventory/types"

interface InventoryItemSelectorProps {
  onSelect: (item: InventoryItem) => void
  className?: string
}

// Transform database item to component item type
const transformItem = (item: any): InventoryItem => ({
  id: item.id,
  name: item.name,
  basePrice: item.basePrice,
  currentStock: item.currentStock,
  sku: item.sku || null,
  status: item.status,
  allowPresale: item.allowPresale || false,
  description: item.description || null,
  type: item.type,
  reservedStock: item.reservedStock || 0,
  minimumStock: item.minimumStock || 0,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  metadata: item.metadata || undefined,
})

export function InventoryItemSelector({ onSelect, className }: InventoryItemSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("")
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load initial items
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      try {
        const result = await searchInventory("")
        if (result.success && result.data) {
          setItems(result.data.map(transformItem))
        }
      } catch (error) {
        console.error("Error loading items:", error)
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [])

  // Handle item selection
  const handleItemChange = (value: string) => {
    const selectedItem = items.find((item) => item.id === value)
    if (selectedItem) {
      setSelectedId(value)
      onSelect(selectedItem)
    }
  }

  return (
    <PopoverSelect
      options={items.map((item) => ({
        label: `${item.name} - Stock: ${item.currentStock} - ${formatCurrency(Number(item.basePrice))}`,
        value: item.id,
        data: item,
      }))}
      value={selectedId}
      onValueChange={handleItemChange}
      placeholder={loading ? "Cargando productos..." : "Seleccionar producto"}
      disabled={loading}
      emptyMessage="No se encontraron productos"
      className={className}
    />
  )
}

