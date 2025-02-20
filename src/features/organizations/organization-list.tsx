// features/organizations/organization-list.tsx
'use client'

import { useState } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { OrganizationTable } from "./organization-table"
import { useToast } from "@/hooks/use-toast"
import { checkPermissions } from "@/lib/auth"

interface OrganizationListProps {
  initialOrganizations: any[]
  error?: string
}

export default function OrganizationList({ initialOrganizations, error }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  const canCreate = checkPermissions('organizations:write')

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold">Organizaciones</h1>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nueva Organización
          </Button>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Organización</DialogTitle>
          </DialogHeader>
          <OrganizationForm 
            onSuccess={(newOrg) => {
              setOrganizations(prev => [...prev, newOrg])
              setShowCreateDialog(false)
              toast({
                title: "Éxito",
                description: "Organización creada correctamente",
              })
            }}
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