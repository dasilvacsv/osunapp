'use client'

import { useEffect, useState } from "react"
import { OrganizationMetrics } from "./organization-metrics"
import { getOrganizationMetrics } from "./organization-actions"

interface ClientMetricsProps {
  organizationId: string
  organization: any
}

export function ClientMetrics({ organizationId, organization }: ClientMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const { data, error } = await getOrganizationMetrics(organizationId)
        if (error) {
          setError(error)
        } else {
          setMetrics(data)
        }
      } catch (err) {
        setError('Failed to load metrics')
      }
    }

    loadMetrics()
  }, [organizationId])

  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <OrganizationMetrics
      organization={organization}
      metrics={metrics}
    />
  )
} 