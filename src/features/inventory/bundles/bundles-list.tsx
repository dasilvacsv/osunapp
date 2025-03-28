"use client"

import { useState, useEffect } from "react"
import { getBundles } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Package, DollarSign, Percent, Tag, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BundleWithItems } from "../types"

export function BundlesList() {
  const [bundles, setBundles] = useState<BundleWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const result = await getBundles()
      if (result.success && result.data) {
        setBundles(result.data)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (bundles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No hay bundles disponibles</h3>
        <p className="text-muted-foreground">Crea tu primer bundle usando la pestaña "Crear Nuevo Bundle".</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <Card key={bundle.id} className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{bundle.name}</CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {formatCurrency(bundle.totalDiscountedPrice)}
              </Badge>
            </div>
            {bundle.description && <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>}
          </CardHeader>

          <CardContent className="py-2 flex-grow">
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Precio base:</span>
                <span className="font-medium">{formatCurrency(bundle.totalBasePrice)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Descuento:</span>
                <span className="font-medium">{bundle.savingsPercentage.toFixed(1)}%</span>
              </div>

              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ahorro:</span>
                <span className="font-medium">{formatCurrency(bundle.savings)}</span>
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
                <span className="font-medium">{formatCurrency(bundle.totalEstimatedCost)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ganancia:</span>
                <span className={`font-medium ${bundle.profit < 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatCurrency(bundle.profit)}
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
            <Button variant="outline" className="w-full" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

