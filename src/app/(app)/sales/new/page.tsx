import React from 'react'
import { OrganizationSelectForm } from "@/features/sales/new/comp"
import { getOrganizations } from "@/features/sales/new/actions"

export default async function NewSalePage() {
  const { data: organizations } = await getOrganizations()
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Sale</h1>
      <div className="max-w-lg mx-auto">
        <OrganizationSelectForm initialOrganizations={organizations || []} />
      </div>
    </div>
  )
}