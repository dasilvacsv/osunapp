"use client"

import { useState } from "react"
import { InventoryTable } from "./inventory-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Package2, RefreshCcw, Plus, Box, ChevronDown, ChevronRight, Tag, Percent } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import type { BundleCategory, StockTransactionInput, Bundle } from "./types"
import { getInventoryItems, stockIn, stockOut, getBundles } from "./actions"
import { BundleManager } from "./bundle-manager"
import { StockManagementForm } from "./stock-management-form"
import { AddProductDialog } from "./AddProductDialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

interface InventoryManagerProps {
  initialData: InventoryItem[]
  bundleCategories: BundleCategory[]
}

export function InventoryManager({ initialData, bundleCategories }: InventoryManagerProps) {
  const [items, setItems] = useState(initialData)
  const [activeTab, setActiveTab] = useState("inventory")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [expandedBundles, setExpandedBundles] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const toggleBundleExpansion = (bundleId: string) => {
    setExpandedBundles(prev => ({
      ...prev,
      [bundleId]: !prev[bundleId]
    }))
  }

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

  const handleStockUpdate = async (input: StockTransactionInput) => {
    try {
      const result =
        input.quantity > 0 ? await stockIn(input) : await stockOut({ ...input, quantity: Math.abs(input.quantity) })

      if (result.success) {
        await refreshData()
        toast({
          title: "Éxito",
          description: "El stock se ha actualizado correctamente.",
        })
        return true
      }
      return false
    } catch (error) {
      console.error("Stock update error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el stock.",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <div className="space-y-4 p-6 bg-background">
      <Tabs
        defaultValue="inventory"
        onValueChange={(value) => {
          setActiveTab(value as "inventory" | "stock" | "bundles")
          if (value === "bundles") {
            loadBundles()
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 gap-4 bg-card">
          <TabsTrigger 
            value="inventory"
            className={cn(
              "flex items-center gap-2 transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground"
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
              "data-[state=inactive]:text-muted-foreground hover:text-foreground"
            )}
          >
            <Box className="h-4 w-4" />
            Gestión de Stock
          </TabsTrigger>
          <TabsTrigger 
            value="bundles"
            className={cn(
              "flex items-center gap-2 transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground"
            )}
          >
            <Package2 className="h-4 w-4" />
            Bundles
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
                          "focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                      >
                        <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsAddProductDialogOpen(true)}
                        className={cn(
                          "flex items-center gap-2",
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90",
                          "focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <InventoryTable items={items} />
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
                  <CardTitle className="text-foreground">Gestión de Stock</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <StockManagementForm
                    items={items}
                    onSubmit={async (data) => {
                      const success = await handleStockUpdate(data)
                      if (!success) {
                        toast({
                          title: "Error",
                          description: "No se pudo actualizar el stock.",
                          variant: "destructive",
                        })
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="bundles" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-foreground">Gestión de Bundles</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <BundleManager
                    categories={bundleCategories}
                    items={items}
                    onBundleCreated={loadBundles}
                  />
                  <motion.div 
                    className="mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Bundles Creados</h3>
                    <AnimatePresence>
                      {bundles.length > 0 ? (
                        <motion.ul className="space-y-3">
                          {bundles.map((bundle, index) => (
                            <motion.li
                              key={bundle.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.1 }}
                              className={cn(
                                "rounded-lg overflow-hidden",
                                "border border-border",
                                "bg-card"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center justify-between p-4",
                                  "cursor-pointer",
                                  "hover:bg-accent/10 transition-colors"
                                )}
                                onClick={() => toggleBundleExpansion(bundle.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    className={cn(
                                      "p-1 rounded-md",
                                      "hover:bg-accent/20 transition-colors"
                                    )}
                                  >
                                    {expandedBundles[bundle.id] ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                  <div>
                                    <h4 className="font-medium text-foreground">{bundle.name}</h4>
                                    <p className="text-sm text-muted-foreground">{bundle.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">
                                      {formatCurrency(bundle.basePrice)}
                                    </span>
                                  </div>
                                  {bundle.discountPercentage > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Percent className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">
                                        {bundle.discountPercentage}%
                                      </span>
                                    </div>
                                  )}
                                  <Badge 
                                    variant={bundle.status === 'ACTIVE' ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {bundle.status.toLowerCase()}
                                  </Badge>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {expandedBundles[bundle.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                      "px-4 pb-4",
                                      "border-t border-border",
                                      "bg-card/50"
                                    )}
                                  >
                                    <div className="pt-4">
                                      <h5 className="text-sm font-medium text-foreground mb-2">
                                        Contenido del Bundle
                                      </h5>
                                      <ul className="space-y-2">
                                        {bundle.items.map((item) => (
                                          <li
                                            key={item.itemId}
                                            className={cn(
                                              "flex items-center justify-between",
                                              "p-2 rounded-md",
                                              "bg-background/50",
                                              "border border-border"
                                            )}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm text-foreground">
                                                {item.itemName}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="text-sm text-muted-foreground">
                                                Cantidad: {item.quantity}
                                              </span>
                                              {item.overridePrice && (
                                                <span className="text-sm font-medium text-foreground">
                                                  {formatCurrency(item.overridePrice)}
                                                </span>
                                              )}
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.li>
                          ))}
                        </motion.ul>
                      ) : (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-muted-foreground text-center py-8"
                        >
                          No hay bundles creados.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
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