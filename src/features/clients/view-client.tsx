// app/components/view-client-dialog.tsx
"use client"

import { useEffect, useState } from 'react'
import { ClientDetails } from './client-details'
import { getClient, getOrganizations, getBeneficiaries } from '@/app/(app)/clientes/client'
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
        if (clientResult.error) {
          throw new Error(clientResult.error)
        }
        
        // Load organizations
        const orgsResult = await getOrganizations()
        if (orgsResult.error) {
          throw new Error(orgsResult.error)
        }
        
        // Load beneficiaries
        const beneficiariesResult = await getBeneficiaries(clientId)
        if (!beneficiariesResult.success) {
          throw new Error(beneficiariesResult.error)
        }
        
        setClient(clientResult.data)
        setOrganizations(orgsResult.data)
        setBeneficiaries(beneficiariesResult.data)
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