import { Suspense } from 'react'
import DashboardComponent from "@/features/dashboard/Dashboard"
import { getDashboardData } from "@/features/dashboard/fetch"
import { Loader2 } from "lucide-react"

export default async function Page() {
  const data = await getDashboardData()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Cargando dashboard...</p>
        </div>
      </div>
    }>
      <DashboardComponent data={data} />
    </Suspense>
  )
}