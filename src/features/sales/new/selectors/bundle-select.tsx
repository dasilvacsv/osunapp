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
  console.log(initialBundles);
  

  // Update bundles when initialBundles changes
  useEffect(() => {
    setBundles(initialBundles);
  }, [initialBundles]);

  // Handle bundle selection
  const handleBundleChange = (value: string) => {
    const selectedBundle = bundles.find(b => b.id === value)
    if (selectedBundle) {
      onBundleSelect(value, selectedBundle)
    }
  }

  return (
    <div className={className}>
      <PopoverSelect
        options={bundles.map(bundle => ({
          label: `${bundle.name} - $${bundle.bundlePrice || bundle.basePrice}`,
          value: bundle.id,
          description: bundle.description,
          // Show items count in the description
          secondaryText: `${bundle.items.length} items`
        }))}
        value={selectedBundleId}
        onValueChange={handleBundleChange}
        placeholder="Select a bundle"
        emptyMessage="No bundles available"
      />
    </div>
  )
} 