import type { Metadata } from "next"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnifiedInventoryForm } from "@/features/inventory/stock/unified-inventory-form"
import { getInventoryItems } from "@/features/inventory/actions"
import { ShoppingBag, CreditCard, Package, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PendingPurchasesTable } from "@/features/inventory/purchases/pending-purchases-table"

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Gestión de Compras",
  description: "Administra las compras de inventario",
}

// Componente para cargar el formulario de inventario
async function InventoryFormLoader() {
  // Obtener los productos para el formulario
  const inventoryResult = await getInventoryItems()
  const inventoryItems = inventoryResult.success ? inventoryResult.data : []

  return <UnifiedInventoryForm items={inventoryItems} />
}

export default function PurchasesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Compras</h1>
          <p className="text-muted-foreground">
            Registra nuevas compras, gestiona pagos pendientes y visualiza el historial de compras.
          </p>
        </div>
        <Button asChild>
          <Link href="/inventario/compras/historial" prefetch={false} className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Ver Historial de Compras
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="register" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="register" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Registrar Compra
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Compras Pendientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Registrar Nueva Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                }
              >
                <InventoryFormLoader />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <PendingPurchasesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

