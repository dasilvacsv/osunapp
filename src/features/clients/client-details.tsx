// app/components/ClientDetails.tsx
"use client"

import { useCallback, useState, useTransition } from 'react'
import { BeneficiaryTable } from './beneficiary-table'
import { getOrganizations, getBeneficiariesByClient, createBeneficiary, updateBeneficiary, deleteBeneficiary } from '@/app/(app)/clientes/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Client, Organization, Beneficiary } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientDetailsProps {
  client: Client
  initialBeneficiaries?: Beneficiary[]
  organizations: Organization[]
}

export function ClientDetails({ client, initialBeneficiaries = [], organizations }: ClientDetailsProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries)
  const [isPending, startTransition] = useTransition()

  const handleCreateBeneficiary = useCallback(async (data: any) => {
    startTransition(async () => {
      const result = await createBeneficiary({...data, clientId: client.id})
      if (result.success && result.data) {
        const newBeneficiary = {
          ...result.data, 
          status: result.data.status || "ACTIVE",
          organization: result.data.organizationId && result.data.organizationId !== 'none' 
            ? organizations.find(o => o.id === result.data.organizationId) 
            : undefined
        } as Beneficiary;
        
        setBeneficiaries(prev => [...prev, newBeneficiary]);
      }
    })
  }, [client.id, organizations])

  const handleUpdateBeneficiary = useCallback(async (id: string, data: any) => {
    startTransition(async () => {
      const result = await updateBeneficiary(id, data)
      if (result.success && result.data) {
        setBeneficiaries(prev => 
          prev.map(beneficiary => {
            if (beneficiary.id === id) {
              const updatedBeneficiary = {
                ...result.data, 
                status: result.data.status || "ACTIVE",
                organization: result.data.organizationId && result.data.organizationId !== 'none'
                  ? organizations.find(o => o.id === result.data.organizationId) 
                  : undefined
              } as Beneficiary;
              return updatedBeneficiary;
            }
            return beneficiary;
          })
        )
      }
    })
  }, [organizations])

  const handleDeleteBeneficiary = useCallback(async (id: string) => {
    startTransition(async () => {
      const result = await deleteBeneficiary(id)
      if (result.success) {
        setBeneficiaries(prev => prev.filter(beneficiary => beneficiary.id !== id))
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
          <CardDescription>
            {client.role === 'PARENT' ? 'Padre/Representante' : 
             client.role === 'EMPLOYEE' ? 'Empleado' : 'Individual'}
            {client.organization && ` - ${client.organization.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="beneficiaries">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="beneficiaries">Beneficiarios</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>
            <TabsContent value="beneficiaries">
              <BeneficiaryTable
                beneficiaries={beneficiaries}
                isLoading={isPending}
                clientId={client.id}
                onCreateBeneficiary={handleCreateBeneficiary}
                onUpdateBeneficiary={handleUpdateBeneficiary}
                onDeleteBeneficiary={handleDeleteBeneficiary}
                organizations={organizations}
              />
            </TabsContent>
            <TabsContent value="info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium">Información del Cliente</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Nombre:</span>
                      <span>{client.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Documento:</span>
                      <span>{client.document || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Teléfono:</span>
                      <span>{client.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">WhatsApp:</span>
                      <span>{client.whatsapp || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Email:</span>
                      <span>{client.contactInfo?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Organización:</span>
                      <span>{client.organization?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}