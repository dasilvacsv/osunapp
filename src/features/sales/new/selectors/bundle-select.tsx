"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { useToast } from "@/hooks/use-toast"

export interface BundleItem {
  id: string
  quantity: number
  overridePrice: number | null
  item: {
    id: string
    name: string
    currentStock: number
    basePrice: number
    status: "ACTIVE" | "INACTIVE"
    sku: string
    metadata: unknown
    currencyType?: "USD" | "BS"
  }
}

export interface Bundle {
  id: string
  name: string
  description: string
  type: "REGULAR"
  basePrice: string
  bundlePrice: string | null
  status: "ACTIVE" | "INACTIVE"
  items: BundleItem[]
  currencyType?: "USD" | "BS"
  conversionRate?: number
}

interface BundleSelectProps {
  selectedBundleId: string
  onBundleSelect: (bundleId: string, bundle: Bundle) => void
  className?: string
  initialBundles: Bundle[]
}

export function BundleSelect({
  selectedBundleId,
  onBundleSelect,
  className,
  initialBundles
}: BundleSelectProps) {
  const { toast } = useToast()
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles)

  // Update bundles when initialBundles changes
  useEffect(() => {
    setBundles(initialBundles)
  }, [initialBundles])

  // Handle bundle selection
  const handleBundleChange = (value: string) => {
    const selectedBundle = bundles.find(b => b.id === value)
    if (selectedBundle) {
      onBundleSelect(value, selectedBundle)
    }
  }

  // Format bundle price based on currency type
  const formatBundlePrice = (bundle: Bundle) => {
    const price = bundle.bundlePrice || bundle.basePrice
    const numericPrice = parseFloat(price)

    if (bundle.currencyType === "BS") {
      return `${numericPrice.toFixed(2)} Bs`
    }
    return `$${numericPrice.toFixed(2)}`
  }

  // Format bundle items prices
  const formatBundleItemsDescription = (bundle: Bundle) => {
    const itemsCount = bundle.items.length
    const itemsWithPrices = bundle.items.map(item => {
      const price = item.overridePrice || parseFloat(item.item.basePrice.toString())
      const currencyType = item.item.currencyType || "USD"
      
      if (currencyType === "BS") {
        return `${item.item.name} (${price.toFixed(2)} Bs)`
      }
      return `${item.item.name} ($${price.toFixed(2)})`
    }).join(", ")

    return `${itemsCount} productos: ${itemsWithPrices}`
  }

  return (
    <div className={className}>
      <PopoverSelect
        options={bundles.map(bundle => ({
          label: `${bundle.name} - ${formatBundlePrice(bundle)}`,
          value: bundle.id,
          description: bundle.description,
          secondaryText: formatBundleItemsDescription(bundle)
        }))}
        value={selectedBundleId}
        onValueChange={handleBundleChange}
        placeholder="Selecciona un paquete"
        emptyMessage="No hay paquetes disponibles"
      />
    </div>
  )
}