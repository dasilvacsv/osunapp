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
      {stockAlerts.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta de Inventario</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {stockAlerts.map((alert, index) => (
                <li key={index}>{alert.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="inventory"
        onValueChange={(value) => {
          setActiveTab(value as "inventory" | "stock" | "bundles" | "analytics")
          if (value === "bundles") {
            loadBundles()
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 gap-4 bg-card">
          <TabsTrigger
            value="inventory"
            className={cn(
              "flex items-center gap-2 transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground",
            )}
          >
            <Package2 className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className={cn(
              "flex items-center gap-2 transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground",
            )}
          >
            <Box className="h-4 w-4" />
            Gestión de Inventario
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className={cn(
              "flex items-center gap-2 transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground",
            )}
          >
            <BarChart4 className="h-4 w-4" />
            Analítica
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="inventory" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center justify-between text-foreground">
                    <span>Artículos del Inventario</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className={cn(
                          "flex items-center gap-2",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        )}
                      >
                        <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsAddProductDialogOpen(true)}
                        className={cn(
                          "flex items-center gap-2",
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90",
                          "focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <InventoryTable items={items} onItemDisabled={refreshData} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="stock" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-foreground">Gestión de Inventario</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <UnifiedInventoryForm
                    items={items.filter((item) => item.status === "ACTIVE")}
                    onInventoryUpdated={refreshData}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-foreground">Análisis de Inventario</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <InventoryAnalytics items={items} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <AddProductDialog
        open={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        onProductAdded={refreshData}
      />
    </div>
  )
}

