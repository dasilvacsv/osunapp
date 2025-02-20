// features/organizations/organization-list.tsx
'use client'

import React, { useState, useTransition } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { OrganizationTable } from "./organization-table"
import { Organization } from "@/lib/types"

interface OrganizationListProps {
  initialOrganizations: Organization[]
}

export default function OrganizationList({ initialOrganizations }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCreate = (newOrg: Organization) => {
    setOrganizations(prev => [...prev, newOrg])
    setShowCreateDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
          </DialogHeader>
          <OrganizationForm 
            onSuccess={handleCreate}
            closeDialog={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <OrganizationTable 
        organizations={organizations}
        setOrganizations={setOrganizations}
      />
    </div>
  )
}