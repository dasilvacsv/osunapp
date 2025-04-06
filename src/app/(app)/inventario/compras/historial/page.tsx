import type { Metadata } from "next"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react"
import Link from "next/link"
import { PurchaseHistoryTable } from "@/features/inventory/purchases/purchase-history-table"

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Historial de Compras",
  description: "Visualiza el historial completo de compras",
}

export default function PurchaseHistoryPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Compras</h1>
          <p className="text-muted-foreground">
            Visualiza todas las compras realizadas, incluyendo pagadas y pendientes.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/inventario/compras" prefetch={false} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Compras
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Todas las Compras
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
            <PurchaseHistoryTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

