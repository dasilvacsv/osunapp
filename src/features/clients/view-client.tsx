// app/components/view-client-dialog.tsx
"use client"

import { useEffect, useState } from 'react'
import { ClientDetails } from './client-details'
import { getClient, getOrganizations, getBeneficiariesByClient } from '@/app/(app)/clientes/client'
import { Client, Organization, Beneficiary } from '@/lib/types'

export default function ViewClient({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        
        // Load client data
        const clientResult = await getClient(clientId)
        if (clientResult.error || !clientResult.data) {
          throw new Error(clientResult.error || 'No client data found')
        }
        
        // Load organizations
        const orgsResult = await getOrganizations()
        if (orgsResult.error || !orgsResult.data) {
          throw new Error(orgsResult.error || 'No organizations found')
        }
        
        // Load beneficiaries
        const beneficiariesResult = await getBeneficiariesByClient(clientId)
        if (!beneficiariesResult.success || !beneficiariesResult.data) {
          throw new Error(beneficiariesResult.error || 'No beneficiaries found')
        }
        
        // Use type assertions to fix type incompatibilities
        setClient(clientResult.data as Client)
        setOrganizations(orgsResult.data as Organization[])
        setBeneficiaries(beneficiariesResult.data as Beneficiary[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [clientId])

  if (isLoading) return <div className="py-8 text-center">Cargando...</div>
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>
  if (!client) return <div className="py-8 text-center">Cliente no encontrado</div>

  return (
    <ClientDetails 
      client={client} 
      initialBeneficiaries={beneficiaries}
      organizations={organizations}
    />
  )
}