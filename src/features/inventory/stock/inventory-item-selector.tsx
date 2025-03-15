"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { formatCurrency } from "@/lib/utils"
import { searchInventory } from "./actions"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
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
  margin: item.margin || "0.30",
  // Calculate cost price based on margin if available
  costPrice: item.margin ? String(Number(item.basePrice) / (1 + Number(item.margin))) : undefined,
})

export function InventoryItemSelector({ onSelect, className }: InventoryItemSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("")
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    setLoading(true)
    try {
      const result = await searchInventory(term)
      if (result.success && result.data) {
        setItems(result.data.map(transformItem))
      }
    } catch (error) {
      console.error("Error searching items:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle item selection
  const handleItemChange = (value: string) => {
    const selectedItem = items.find((item) => item.id === value)
    if (selectedItem) {
      setSelectedId(value)
      onSelect(selectedItem)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 mb-2"
        />
      </div>
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
    </div>
  )
}

