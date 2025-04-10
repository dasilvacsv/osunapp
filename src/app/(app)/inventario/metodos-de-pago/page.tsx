import { PaymentMethodsTable } from "@/features/inventory/payments/payment-table"
import { PaymentMetrics } from "@/features/inventory/payments/payment-metrics"
import { getPaymentData } from "@/features/inventory/payments/actions"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1
  const { payments, metrics, totalPages } = 
    await getPaymentData({ page: currentPage, pageSize: 10 })

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventario" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Inventario
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Métodos de Pago</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra y visualiza todos los pagos del sistema
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PaymentMetrics metrics={metrics} />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-semibold">Historial de Pagos</h2>
              <p className="text-sm text-muted-foreground">
                Lista detallada de todos los pagos realizados
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Suspense fallback={<TableSkeleton />}>
            <PaymentMethodsTable 
              data={payments}
              pageCount={totalPages}
              currentPage={currentPage}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
      ))}
    </div>
  )
}