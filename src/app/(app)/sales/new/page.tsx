import React from 'react'
import { OrganizationSelectForm } from "@/features/sales/new/comp"
import { getOrganizations, getClients } from "@/features/sales/new/actions"

export default async function NewSalePage() {
  const { data: organizations } = await getOrganizations()
  const { data: clients } = await getClients()
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Sale</h1>
      <div className="max-w-lg mx-auto">
        <OrganizationSelectForm 
          initialOrganizations={organizations || []} 
          initialClients={clients || []}
        />
      </div>
    </div>
  )
}