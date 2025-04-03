"use client"

// Update the component to properly handle the beneficiary and bundle data
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FilePenLine } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { getDraftSalesData } from "@/lib/data"

interface BorradoresTableProps {
  initialData?: any[]
}

export function BorradoresTable({ initialData = [] }: BorradoresTableProps) {
  const [sales, setSales] = useState<any[]>(initialData)
  const [loading, setLoading] = useState(!initialData.length)
  const { toast } = useToast()

  useEffect(() => {
    if (!initialData.length) {
      fetchDraftSales()
    }
  }, [initialData.length])

  const fetchDraftSales = async () => {
    try {
      setLoading(true)
      const result = await getDraftSalesData()

      if (result.success) {
        // Format the data to ensure it has the expected structure
        const formattedSales = (result.data || []).map((sale: any) => ({
          ...sale,
          client: sale.client,
          beneficiario: sale.beneficiario,
          bundle: sale.bundle,
          bundleName: sale.bundle?.name || "N/A",
          organization: sale.organization,
          totalAmount: typeof sale.totalAmount === "string" ? Number.parseFloat(sale.totalAmount) : sale.totalAmount,
          purchaseDate: sale.purchaseDate ? new Date(sale.purchaseDate) : null,
        }))
        setSales(formattedSales)
      } else {
        throw new Error(result.error || "Error fetching draft sales")
      }
    } catch (error) {
      console.error("Error fetching draft sales:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error fetching draft sales",
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
            <FilePenLine className="h-5 w-5" />
            Borradores
          </CardTitle>
          <CardDescription>No hay ventas en estado de borrador</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Button variant="outline" onClick={fetchDraftSales} className="gap-2">
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
      title="Borradores"
      description="Ventas en estado de borrador pendientes de aprobación"
      exportData={() => console.log("Export drafts")}
      refreshData={fetchDraftSales}
    />
  )
}

