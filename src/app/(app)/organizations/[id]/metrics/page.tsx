
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ClientMetrics } from "@/features/organizations/client-metrics"
import { getOrganization } from "@/features/organizations/organization"

export const dynamic = 'force-dynamic'

interface MetricsPageProps {
  params: {
    id: string
  }
}

export default async function MetricsPage({ params }: MetricsPageProps) {
  const { data: organization } = await getOrganization(params.id)
  if (!organization) {
    return notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card text-card-foreground p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {organization.name} Metrics
          </h1>
          <p className="text-muted-foreground">
            View detailed performance metrics for this organization
          </p>
        </div>
      </div>

      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ClientMetrics organizationId={params.id} organization={organization} />
      </Suspense>
    </div>
  )
} 