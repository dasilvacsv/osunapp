"use client";

import { useState, useCallback, useEffect } from "react"
import { DataTable } from "@/features/sales/views/data-table"
import { columns } from "@/features/sales/views/columns"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, ShoppingCart, CreditCard, FileText, Calendar, Gift } from "lucide-react"
import { DeletePackageDialog } from "@/features/sales/delete-package-dialog"
import { PaymentPlanDialog } from "@/features/sales/views/plan/payment-plan-dialog"
import { PaymentTable } from "@/features/sales/views/payment-table"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getSalesData2, getDraftSalesData, getDonationSalesData } from "@/features/sales/views/actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DailySalesReport } from "@/features/sales/views/daily-sales-report"

export default function SalesPageContent({ initialSales, viewType = "sales" }: { initialSales: any[], viewType?: "sales" | "drafts" | "donations" }) {
  const [sales, setSales] = useState<any[]>(initialSales)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<{ id: string; name: string } | null>(null)
  const [selectedSale, setSelectedSale] = useState<{ id: string; amount: number } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState(viewType)

  const router = useRouter()
  const { toast } = useToast()

  const refreshSales = useCallback(async () => {
    setIsRefreshing(true)
    try {
      let result;
      switch (activeTab) {
        case "drafts":
          result = await getDraftSalesData();
          break;
        case "donations":
          result = await getDonationSalesData();
          break;
        default:
          result = await getSalesData2();
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

      toast({
        title: "Datos actualizados",
        description: "La lista ha sido actualizada",
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, toast])

  useEffect(() => {
    refreshSales()
  }, [activeTab, refreshSales])

  const handleSaleSuccess = (newSale: any) => {
    setSales((prev) => [newSale, ...prev])
    router.refresh()
  }

  const handleDeleteSuccess = () => {
    refreshSales()
    setSelectedBundle(null)
  }

  const handlePaymentPlanSuccess = () => {
    refreshSales()
    setRefreshTrigger((prev) => prev + 1)
    setSelectedSale(null)
  }

  const handleSaleSelect = (sale: { id: string; amount: number }) => {
    setSelectedSale(sale)
    setActiveTab("payments")
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          {activeTab === "donations" ? (
            <Gift className="h-8 w-8 text-purple-500" />
          ) : activeTab === "drafts" ? (
            <FileText className="h-8 w-8 text-amber-500" />
          ) : (
            <ShoppingCart className="h-8 w-8 text-primary" />
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === "donations" ? "Donaciones" : activeTab === "drafts" ? "Borradores" : "Registro de Ventas"}
          </h1>
        </motion.div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="space-y-4">
          <TabsList>
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

        <TabsContent value="sales" className="space-y-6">
          <DataTable 
            columns={columns} 
            data={sales} 
            searchKey="client.name" 
            onSaleSelect={handleSaleSelect}
            title="Ventas"
            description="Lista completa de ventas"
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <DataTable 
            columns={columns} 
            data={sales} 
            searchKey="client.name" 
            onSaleSelect={handleSaleSelect}
            title="Borradores"
            description="Ventas en estado de borrador pendientes de aprobación"
          />
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <DataTable 
            columns={columns} 
            data={sales} 
            searchKey="client.name" 
            onSaleSelect={handleSaleSelect}
            title="Donaciones"
            description="Lista de ventas marcadas como donación"
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {selectedSale ? (
            <PaymentTable
              purchaseId={selectedSale.id}
              refreshTrigger={refreshTrigger}
              onPaymentUpdated={() => {
                setRefreshTrigger((prev) => prev + 1)
                refreshSales()
              }}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">Selecciona una venta para ver sus pagos</div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <DailySalesReport />
        </TabsContent>
      </Tabs>

      {selectedBundle && (
        <DeletePackageDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          bundleId={selectedBundle.id}
          bundleName={selectedBundle.name}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {selectedSale && (
        <PaymentPlanDialog
          open={showPaymentPlanDialog}
          onOpenChange={setShowPaymentPlanDialog}
          purchaseId={selectedSale.id}
          totalAmount={selectedSale.amount}
          onSuccess={handlePaymentPlanSuccess}
        />
      )}
    </motion.div>
  )
}