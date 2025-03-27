"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { getDonationSalesData } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DonationsTableProps {
  initialData?: any[]
}

export function DonationsTable({ initialData = [] }: DonationsTableProps) {
  const [sales, setSales] = useState<any[]>(initialData)
  const [loading, setLoading] = useState(!initialData.length)
  const { toast } = useToast()

  useEffect(() => {
    if (!initialData.length) {
      fetchDonationSales()
    }
  }, [initialData.length])

  const fetchDonationSales = async () => {
    try {
      setLoading(true)
      const result = await getDonationSalesData()

      if (result.success) {
        setSales(result.data || [])
      } else {
        throw new Error(result.error || "Error fetching donation sales")
      }
    } catch (error) {
      console.error("Error fetching donation sales:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error fetching donation sales",
        variant: "destructive",
      })
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Donaciones
          </CardTitle>
          <CardDescription>No hay ventas marcadas como donación</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Button variant="outline" onClick={fetchDonationSales} className="gap-2">
            <Loader2 className="h-4 w-4" />
            Actualizar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={sales}
      searchKey="client.name"
      title="Donaciones"
      description="Ventas marcadas como donación"
      exportData={() => console.log("Export donations")}
      refreshData={fetchDonationSales}
    />
  )
}

