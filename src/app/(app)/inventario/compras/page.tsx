import { PendingPurchasesTable } from "@/features/inventory/purchases/pending-purchases-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, ShoppingBag } from "lucide-react"
import { UnifiedInventoryForm } from "@/features/inventory/stock/unified-inventory-form"
import { getInventoryItems } from "@/features/inventory/actions"

export const dynamic = "force-dynamic"

export default async function PurchasesPage() {
  // Obtener los items de inventario para el formulario de compras
  const itemsResult = await getInventoryItems()
  const items = itemsResult.success ? itemsResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Compras</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Compras Pendientes
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Registrar Compra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Compras a Crédito Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PendingPurchasesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Registrar Nueva Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UnifiedInventoryForm items={items} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

