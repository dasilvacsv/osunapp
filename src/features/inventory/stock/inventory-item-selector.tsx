// components/inventory-item-selector.tsx
"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { formatCurrency } from "@/lib/utils"
import { searchInventory } from "./actions"
import type { InventoryItem } from "@/features/sales/new/types"

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
  sku: item.sku || undefined,
  status: item.status,
  allowPreSale: item.allowPresale,
  description: item.description || undefined,
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
      const result = await searchInventory("")
      if (result.success && result.data) {
        setItems(result.data.map(transformItem))
      }
      setLoading(false)
    }
    loadItems()
  }, [])

  // Handle item selection
  const handleItemChange = (value: string) => {
    const selectedItem = items.find(item => item.id === value)
    if (selectedItem) {
      setSelectedId(value)
      onSelect(selectedItem)
    }
  }

  return (
    <PopoverSelect
      options={items.map(item => ({
        label: `${item.name} - Stock: ${item.currentStock} - ${formatCurrency(Number(item.basePrice))}`,
        value: item.id,
        data: item
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