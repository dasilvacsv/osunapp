"use client"

import { useState, useEffect } from "react"
import { InventoryTable } from "./inventory-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Package2, RefreshCcw, Plus, Box, BarChart4, AlertTriangle, Archive, Percent } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import type { BundleCategory, StockTransactionInput, Bundle } from "./types"
import { getInventoryItems, stockIn, stockOut, getBundles, checkStockAlerts } from "./actions"

import { UnifiedInventoryForm } from "../stock/unified-inventory-form"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { InventoryAnalytics } from "./inventory-analytics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AddProductDialog } from "./AddProductDialog"

interface InventoryManagerProps {
  initialData: InventoryItem[]
}

export function InventoryManager({ initialData }: InventoryManagerProps) {
  const [items, setItems] = useState(initialData)
  const [activeTab, setActiveTab] = useState("inventory")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [expandedBundles, setExpandedBundles] = useState<Record<string, boolean>>({})
  const [stockAlerts, setStockAlerts] = useState<{ itemId: string; message: string }[]>([])
  const { toast } = useToast()

  const fetchStockAlerts = async () => {
    try {
      const alerts = await checkStockAlerts()
      setStockAlerts(alerts)
    } catch (error) {
      console.error("Error fetching stock alerts:", error)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchStockAlerts()
  }, [])


  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      const result = await getInventoryItems()
      if (result.success && result.data) {
        setItems(result.data)
        toast({
          title: "Actualizado",
          description: "Los datos del inventario han sido actualizados.",
        })
      }

      // Refresh alerts too
      await fetchStockAlerts()
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
  }

  const loadBundles = async () => {
    try {
      const result = await getBundles()
      if (result.success && result.data) {
        setBundles(result.data)
      }
    } catch (error) {
      console.error("Error loading bundles:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los bundles.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-6 bg-background">

<InventoryTable items={items} onItemDisabled={refreshData} />

    </div>
  )
}

