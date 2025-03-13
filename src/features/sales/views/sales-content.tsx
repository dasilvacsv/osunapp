"use client"

import { DataTable } from "@/features/sales/views/data-table"
import { columns } from "@/features/sales/views/columns"
import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCw, ShoppingCart, CreditCard } from "lucide-react"
import { NewSaleDialog } from "@/features/sales/new-sale-dialog"
import { DeletePackageDialog } from "@/features/sales/delete-package-dialog"
import { PaymentPlanDialog } from "@/features/sales/payment-plan-dialog"
import { PaymentTable } from "@/features/sales/payment-table"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getSalesData } from "@/features/sales/actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SalesPageContent({ initialSales }: { initialSales: any[] }) {
  const [sales, setSales] = useState(initialSales)
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

  const refreshSales = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const result = await getSalesData()
      if (result.success) {
        setSales(result.data)
        toast({
          title: "Datos actualizados",
          description: "La lista de ventas ha sido actualizada",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
      } else {
        throw new Error(result.error)
      }
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
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshSales}
            disabled={isRefreshing}
            className={`transition-all duration-700 ${isRefreshing ? "rotate-180" : ""}`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowDialog(true)} className="group">
            <PlusIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-125" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="sales" className="flex items-center gap-2 px-6 py-2">
            <ShoppingCart className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 px-6 py-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DataTable 
              columns={columns} 
              data={sales} 
              searchKey="client.name" 
              onSaleSelect={handleSaleSelect}
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
                  setRefreshTrigger(prev => prev + 1)
                  refreshSales()
                }}
              />
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Selecciona una venta para ver sus pagos
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewSaleDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
        onSuccess={handleSaleSuccess} 
      />

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