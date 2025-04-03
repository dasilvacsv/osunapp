"use client"

import { useState, useEffect } from "react"
import { getBundles } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Package, DollarSign, Percent, Tag, ShoppingBag, Coins, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BundleWithItems } from "../types"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

export function BundlesList() {
  const [groupedBundles, setGroupedBundles] = useState<Record<string, BundleWithItems[]>>({})
  const [loading, setLoading] = useState(true)
  const [openBundleId, setOpenBundleId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const result = await getBundles()
      if (result.success && result.data) {
        const grouped = result.data.reduce((acc: Record<string, BundleWithItems[]>, bundle) => {
          const orgName = bundle.organization?.name || "Sin Organización"
          if (!acc[orgName]) acc[orgName] = []
          acc[orgName].push(bundle)
          return acc
        }, {})
        setGroupedBundles(grouped)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron cargar los bundles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching bundles:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los bundles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [])

  const formatBundleCurrency = (amount: number, currencyType?: string, conversionRate?: number) => {
    if (currencyType === "BS") {
      const rate = conversionRate || 1
      return `${(amount * rate).toFixed(2)} Bs`
    }
    return formatCurrency(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (Object.keys(groupedBundles).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No hay bundles disponibles</h3>
        <p className="text-muted-foreground">Crea tu primer bundle usando la pestaña "Crear Nuevo Bundle".</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedBundles).map(([organization, bundles]) => (
        <div key={organization} className="space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold">
              Organización: {organization}
              <Badge variant="secondary" className="ml-2">
                {bundles.length} {bundles.length === 1 ? "Bundle" : "Bundles"}
              </Badge>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{bundle.name}</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {formatBundleCurrency(
                        bundle.totalDiscountedPrice,
                        bundle.currencyType,
                        Number(bundle.conversionRate)
                      )}
                    </Badge>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                  )}
                  {bundle.currencyType === "BS" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-2">
                      <Coins className="h-3 w-3 mr-1" />
                      Bolívares
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="py-2 flex-grow">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Precio base:</span>
                      <span className="font-medium">
                        {formatBundleCurrency(
                          bundle.totalBasePrice,
                          bundle.currencyType,
                          Number(bundle.conversionRate)
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Descuento:</span>
                      <span className="font-medium">{bundle.savingsPercentage.toFixed(1)}%</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ahorro:</span>
                      <span className="font-medium">
                        {formatBundleCurrency(
                          bundle.savings,
                          bundle.currencyType,
                          Number(bundle.conversionRate)
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{bundle.items.length}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Costo estimado:</span>
                      <span className="font-medium">
                        {formatBundleCurrency(
                          bundle.totalEstimatedCost,
                          bundle.currencyType,
                          Number(bundle.conversionRate)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ganancia:</span>
                      <span className={`font-medium ${bundle.profit < 0 ? "text-destructive" : "text-green-600"}`}>
                        {formatBundleCurrency(
                          bundle.profit,
                          bundle.currencyType,
                          Number(bundle.conversionRate)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margen:</span>
                      <span className={`font-medium ${bundle.profitPercentage < 0 ? "text-destructive" : "text-green-600"}`}>
                        {bundle.profitPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-4">
                  <Collapsible
                    open={openBundleId === bundle.id}
                    onOpenChange={(isOpen) => setOpenBundleId(isOpen ? bundle.id : null)}
                    className="w-full space-y-2"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        {openBundleId === bundle.id ? (
                          <ChevronUp className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        {openBundleId === bundle.id ? "Ocultar Detalles" : "Ver Detalles"}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Categoría ID:</span>
                          <span className="font-medium">{bundle.categoryId}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha de creación:</span>
                          <span className="font-medium">{formatDate(new Date(bundle.createdAt))}</span>
                        </div>

                        {bundle.currencyType === "BS" && bundle.conversionRate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tasa de cambio:</span>
                            <span className="font-medium">{Number(bundle.conversionRate).toFixed(2)} Bs/USD</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Artículos incluidos:</h4>
                        <div className="space-y-3">
                          {bundle.items.map((item) => (
                            <div key={item.itemId} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <p className="font-medium">{item.item.name}</p>
                                <p className="text-muted-foreground text-xs">SKU: {item.item.sku}</p>
                              </div>
                              <div className="text-right">
                                <p>{item.quantity} x {formatCurrency(Number(item.overridePrice || item.item.basePrice))}</p>
                                <p className="text-muted-foreground text-xs">
                                  {formatBundleCurrency(
                                    Number(item.overridePrice || item.item.basePrice) * item.quantity,
                                    bundle.currencyType,
                                    Number(bundle.conversionRate)
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}