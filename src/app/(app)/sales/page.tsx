// app/sales/page.tsx
'use client'

import { SalesView } from "@/features/sales/sales-view"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { getSalesData } from "@/features/sales/actions"
import { SalesDetails } from "@/features/sales/sales-details"
import { useToast } from "@/hooks/use-toast"

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadSales = async () => {
      const result = await getSalesData()
      if (result.success) {
        setSales(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    }
    loadSales()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registro de Ventas</h1>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      <SalesView sales={sales} />
      
      {selectedSale && (
        <SalesDetails
          sale={selectedSale}
          open={!!selectedSale}
          onOpenChange={() => setSelectedSale(null)}
        />
      )}
    </div>
  )
}