"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { DataTable } from "@/features/sales/views/data-table"
import { columns } from "@/features/sales/views/columns"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, ShoppingCart, CreditCard, FileText, Calendar, Gift } from "lucide-react"
import { DeletePackageDialog } from "@/features/sales/delete-package-dialog"
import { PaymentPlanDialog } from "@/features/sales/views/plan/payment-plan-dialog"
import { PaymentTable } from "@/features/sales/views/payment-table"
import { useRouter } from "next/navigation"
import { getSalesData2, getDraftSalesData, getDonationSalesData } from "@/features/sales/views/actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DailySalesReport } from "@/features/sales/views/daily-sales-report"
import { useSession } from "next-auth/react"

type TabType = "sales" | "drafts" | "donations" | "payments" | "reports"

export default function SalesPageContent({
  initialSales,
  viewType = "sales",
}: {
  initialSales: any[]
  viewType?: TabType
}) {
  const [sales, setSales] = useState<any[]>(initialSales)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [selectedSale, setSelectedSale] = useState<{ id: string; amount: number } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>(viewType)

  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Memoize session-related values
  const isAdmin = useMemo(() => session?.user?.role === "ADMIN", [session])

  const refreshSales = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes

    setIsRefreshing(true)
    try {
      let result
      switch (activeTab) {
        case "drafts":
          result = await getDraftSalesData()
          break
        case "donations":
          result = await getDonationSalesData()
          break
        default:
          result = await getSalesData2()
      }

      if (result.success && result.data) {
        const formattedSales = result.data.map((sale: any) => ({
          ...sale,
          client: sale.client,
          beneficiario: sale.beneficiario,
          bundleName: sale.bundle?.name || "N/A",
          organization: sale.organization,
          totalAmount: typeof sale.totalAmount === "string" ? Number.parseFloat(sale.totalAmount) : sale.totalAmount,
          purchaseDate: sale.purchaseDate ? new Date(sale.purchaseDate) : null,
          payments: sale.payments || [],
          paymentPlans: sale.paymentPlans || [],
          items: sale.items || [],
        }))

        setSales(formattedSales)
      }
    } catch (error) {
      console.error("Error refreshing sales:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, isRefreshing, toast])

  // Optimized effect for sales updates
  useEffect(() => {
    const handleSalesUpdated = (event: CustomEvent) => {
      const { action } = event.detail
      if (action === "approve-donation" || action === "reject-donation") {
        refreshSales()
      }
    }

    window.addEventListener("sales-updated", handleSalesUpdated as EventListener)
    return () => {
      window.removeEventListener("sales-updated", handleSalesUpdated as EventListener)
    }
  }, [refreshSales])

  // Load initial data
  useEffect(() => {
    refreshSales()
  }, [activeTab, refreshSales])

  const handleSaleSelect = useCallback((sale: { id: string; amount: number }) => {
    setSelectedSale(sale)
    setActiveTab("payments")
  }, [])

  const handlePaymentPlanSuccess = useCallback(() => {
    refreshSales()
    setRefreshTrigger(prev => prev + 1)
    setSelectedSale(null)
  }, [refreshSales])

  // Memoize tab content for better performance
  const renderTabContent = useMemo(() => {
    const commonTableProps = {
      columns,
      searchKey: "client.name",
      onSaleSelect: handleSaleSelect,
    }

    switch (activeTab) {
      case "sales":
        return (
          <DataTable
            {...commonTableProps}
            data={sales}
            title="Ventas"
            description="Lista completa de ventas"
          />
        )
      case "drafts":
        return (
          <DataTable
            {...commonTableProps}
            data={sales}
            title="Borradores"
            description="Ventas en estado de borrador pendientes de aprobación"
          />
        )
      case "donations":
        return (
          <DataTable
            {...commonTableProps}
            data={sales}
            title="Donaciones"
            description="Lista de ventas marcadas como donación"
          />
        )
      case "payments":
        return selectedSale ? (
          <PaymentTable
            purchaseId={selectedSale.id}
            refreshTrigger={refreshTrigger}
            onPaymentUpdated={() => {
              setRefreshTrigger(prev => prev + 1)
              refreshSales()
            }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Selecciona una venta para ver sus pagos
          </div>
        )
      case "reports":
        return <DailySalesReport />
      default:
        return null
    }
  }, [activeTab, sales, selectedSale, refreshTrigger, handleSaleSelect, refreshSales])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {activeTab === "donations" ? (
            <Gift className="h-8 w-8 text-purple-500" />
          ) : activeTab === "drafts" ? (
            <FileText className="h-8 w-8 text-amber-500" />
          ) : (
            <ShoppingCart className="h-8 w-8 text-primary" />
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === "donations"
              ? "Donaciones"
              : activeTab === "drafts"
              ? "Borradores"
              : "Registro de Ventas"}
          </h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refreshSales}
          disabled={isRefreshing}
          className={`transition-all duration-700 ${isRefreshing ? "rotate-180" : ""}`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full space-y-6">
        <div className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="sales" className="flex items-center gap-2 px-6 py-2">
              <ShoppingCart className="h-4 w-4" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2 px-6 py-2">
              <FileText className="h-4 w-4" />
              Borradores
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center gap-2 px-6 py-2">
              <Gift className="h-4 w-4" />
              Donaciones
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 px-6 py-2">
              <CreditCard className="h-4 w-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 px-6 py-2">
              <Calendar className="h-4 w-4" />
              Cierre Diario
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => router.push("/sales/new")} className="group pl-4">
            <PlusIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-125" />
            Nueva Venta
          </Button>
        </div>

        <TabsContent value={activeTab} className="space-y-6">
          {renderTabContent}
        </TabsContent>
      </Tabs>

      {selectedSale && (
        <PaymentPlanDialog
          open={showPaymentPlanDialog}
          onOpenChange={setShowPaymentPlanDialog}
          purchaseId={selectedSale.id}
          totalAmount={selectedSale.amount}
          onSuccess={handlePaymentPlanSuccess}
        />
      )}
    </div>
  )
}