import { Suspense } from "react"
import { NewSaleForm } from "@/features/sales/new/new-sale-form"
import { getClients, getOrganizations, getProducts, getBundles } from "@/features/sales/new/actions"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Nueva Venta | Sistema de Ventas",
  description: "Crear una nueva venta en el sistema",
}

export default async function NewSalePage() {
  // Fetch initial data for selectors
  const [clientsResult, organizationsResult, productsResult, bundlesResult] = await Promise.all([
    getClients(),
    getOrganizations(),
    getProducts(),
    getBundles(),
  ])

  const initialClients = clientsResult.data || []
  const initialOrganizations = organizationsResult.data || []
  const initialProducts = productsResult.data || []
  const initialBundles = bundlesResult.data || []

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Nueva Venta</h1>

      <Suspense fallback={<SaleFormSkeleton />}>
        <NewSaleForm
          initialClients={initialClients}
          initialOrganizations={initialOrganizations}
          initialProducts={initialProducts}
          initialBundles={initialBundles}
        />
      </Suspense>
    </div>
  )
}

function SaleFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <Skeleton className="h-12 w-full" />
    </div>
  )
}

