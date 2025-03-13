"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Calendar } from "lucide-react"

interface SaleTypeSelectorProps {
  onTypeChange: (type: "DIRECT" | "PRESALE") => void
  defaultValue?: "DIRECT" | "PRESALE"
}

export function SaleTypeSelector({ onTypeChange, defaultValue = "DIRECT" }: SaleTypeSelectorProps) {
  const [activeTab, setActiveTab] = useState<"DIRECT" | "PRESALE">(defaultValue)

  const handleTabChange = (value: string) => {
    const saleType = value as "DIRECT" | "PRESALE"
    setActiveTab(saleType)
    onTypeChange(saleType)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="DIRECT" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Venta Directa
        </TabsTrigger>
        <TabsTrigger value="PRESALE" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Preventa
        </TabsTrigger>
      </TabsList>
      <TabsContent value="DIRECT" className="pt-4">
        <p className="text-sm text-muted-foreground">
          La venta directa procesa inmediatamente el pago y entrega de productos.
        </p>
      </TabsContent>
      <TabsContent value="PRESALE" className="pt-4">
        <p className="text-sm text-muted-foreground">
          La preventa permite reservar productos y programar pagos antes de la entrega.
        </p>
      </TabsContent>
    </Tabs>
  )
}

