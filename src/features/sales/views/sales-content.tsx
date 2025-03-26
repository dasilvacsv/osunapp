"use client"

import { DataTable } from "@/features/sales/views/data-table"
import { columns } from "@/features/sales/views/columns"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, ShoppingCart, CreditCard, FileText, Calendar } from "lucide-react"
import { DeletePackageDialog } from "@/features/sales/delete-package-dialog"
import { PaymentPlanDialog } from "@/features/sales/views/plan/payment-plan-dialog"
import { PaymentTable } from "@/features/sales/views/payment-table"
import { useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getSalesData2, getDraftSalesData } from "@/features/sales/views/actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DailySalesReport } from "@/features/sales/views/daily-sales-report"

export default function SalesPageContent({ initialSales }: { initialSales: any[] }) {
  const [sales, setSales] = useState<any[]>(initialSales)
  const [draftSales, setDraftSales] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<{ id: string; name: string } | null>(null)
  const [selectedSale, setSelectedSale] = useState<{ id: string; amount: number } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("sales")

  const router = useRouter()
  const { toast } = useToast()

  // Initial load of draft sales
  useEffect(() => {
    const loadDraftSales = async () => {
      try {
        const draftResult = await getDraftSalesData()

        if (draftResult.success && draftResult.data) {
          const formattedDrafts = draftResult.data.map((sale: any) => ({
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

          setDraftSales(formattedDrafts)
        }
      } catch (error) {
        console.error("Error loading draft sales:", error)
      }
    }

    loadDraftSales()
  }, [])

  const refreshSales = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [salesResult, draftResult] = await Promise.all([getSalesData2(), getDraftSalesData()])

      if (salesResult.success && salesResult.data) {
        // Transform the data to match the expected format for the table
        const formattedSales = salesResult.data.map((sale: any) => ({
          ...sale,
          // Ensure the client object has the expected structure
          client: sale.client,
          // Include beneficiario information
          beneficiario: sale.beneficiario,
          // Include bundle name
          bundleName: sale.bundle?.name || "N/A",
          // Ensure organization is properly structured
          organization: sale.organization,
          // Format totalAmount as number if it's a string
          totalAmount: typeof sale.totalAmount === "string" ? Number.parseFloat(sale.totalAmount) : sale.totalAmount,
          // Ensure purchaseDate is a Date object
          purchaseDate: sale.purchaseDate ? new Date(sale.purchaseDate) : null,
          // Include payment information
          payments: sale.payments || [],
          paymentPlans: sale.paymentPlans || [],
          // Include items information
          items: sale.items || [],
        }))

        setSales(formattedSales)
      }

      if (draftResult.success && draftResult.data) {
        const formattedDrafts = draftResult.data.map((sale: any) => ({
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

        setDraftSales(formattedDrafts)
      }

      toast({
        title: "Datos actualizados",
        description: "La lista de ventas ha sido actualizada",
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

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
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Registro de Ventas</h1>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DataTable columns={columns} data={sales} searchKey="client.name" onSaleSelect={handleSaleSelect} />
          </motion.div>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DataTable
              columns={columns}
              data={draftSales}
              searchKey="client.name"
              onSaleSelect={handleSaleSelect}
              title="Borradores de Ventas"
              description="Ventas en estado de borrador pendientes de aprobación"
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {selectedSale ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <PaymentTable
                purchaseId={selectedSale.id}
                refreshTrigger={refreshTrigger}
                onPaymentUpdated={() => {
                  setRefreshTrigger((prev) => prev + 1)
                  refreshSales()
                }}
              />
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Selecciona una venta para ver sus pagos</div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DailySalesReport />
          </motion.div>
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

