"use client"

import { useEffect, useState } from "react"
import { getAllBundlesAndItems } from "./actions"

interface InventoryItem {
  id: string
  name: string
  currentStock: number
  basePrice: string
  status: "ACTIVE" | "INACTIVE" | null
  metadata: Record<string, any> | null
  sku?: string
  description?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

interface Bundle {
  id: string
  name: string
  description: string | null
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
  basePrice: string
  status: "ACTIVE" | "INACTIVE" | null
  items: Array<{
    id: string
    quantity: number
    overridePrice?: string | null
    item: InventoryItem
  }>
  createdAt?: Date | null
  updatedAt?: Date | null
  totalSales?: number
  lastSaleDate?: Date | null
  totalRevenue?: string
}

interface BundlesAndItemsData {
  bundles: Bundle[]
  items: InventoryItem[]
}

export function BundlesAndItems() {
  const [data, setData] = useState<BundlesAndItemsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllBundlesAndItems()
        if (result.success && result.data) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to fetch data")
        }
      } catch (err) {
        setError("An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data available</div>

  return (
    <div>
      <h2>Bundles ({data.bundles.length})</h2>
      <pre>{JSON.stringify(data.bundles, null, 2)}</pre>
      
      <h2>Items ({data.items.length})</h2>
      <pre>{JSON.stringify(data.items, null, 2)}</pre>
    </div>
  )
} 