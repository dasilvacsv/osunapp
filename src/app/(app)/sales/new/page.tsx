import React from 'react'
import { OrganizationSelectForm } from "@/features/sales/new/comp"
import { getOrganizations, getClients } from "@/features/sales/new/actions"
import { getAllBundlesAndItems } from '@/features/sales/new/products'


export default async function NewSalePage() {
  const { data: organizations } = await getOrganizations()
  const { data: clients } = await getClients()
  const { data: bundlesAndItems } = await getAllBundlesAndItems()
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Sale</h1>
      <div className="max-w-lg mx-auto">
        <OrganizationSelectForm 
          initialOrganizations={organizations || []} 
          initialClients={clients || []}
          initialBundles={bundlesAndItems?.bundles || []}
          initialItems={bundlesAndItems?.items || []}
        />
      </div>
    </div>
  )
}