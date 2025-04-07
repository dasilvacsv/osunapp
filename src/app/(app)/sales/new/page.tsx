import { Suspense } from "react"
import { auth } from "@/features/auth"
import { redirect } from "next/navigation"
import NewSaleForm from "@/features/sales/new/new-sale-form"
import { getClients, getOrganizations, getProducts, getBundles } from "@/features/sales/new/actions"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Nueva Venta | Sistema de Ventas",
  description: "Crear una nueva venta en el sistema",
}

export default async function NewSalePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/sign-in")
  }

  // Fetch initial data for selectors
  const [clientsResult, organizationsResult, productsResult, bundlesResult] = await Promise.all([
    getClients(),
    getOrganizations(),
    getProducts(),
    getBundles(),
  ])

  const initialClients = clientsResult.success ? clientsResult.data : []
  const initialOrganizations = organizationsResult.success ? organizationsResult.data : []
  const initialProducts = productsResult.success ? productsResult.data : []
  const initialBundles = bundlesResult.success ? bundlesResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Nueva Venta</h1>

      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <NewSaleForm
          initialClients={initialClients}
          initialOrganizations={initialOrganizations}
          initialProducts={initialProducts}
          initialBundles={initialBundles}
          userRole={session.user.role || "OPERATOR"}
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

