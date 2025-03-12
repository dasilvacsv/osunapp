import React from 'react'
import { OrganizationSelectForm } from "@/features/sales/new/comp"

export default function NewSalePage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Sale</h1>
      <div className="max-w-lg mx-auto">
        <OrganizationSelectForm />
      </div>
    </div>
  )
}