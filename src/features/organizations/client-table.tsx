'use client'

import { useState } from "react"
import { toast } from "sonner"
import { OrganizationTable } from "./organization-table"
import { createOrganization, deleteOrganization, updateOrganization } from "./organization"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ClientTable({ initialOrganizations }: { initialOrganizations: any[] }) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null)

  const handleCreate = async (data: any) => {
    try {
      const result = await createOrganization(data)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) => [...prev, result.data])
      toast.success("Organization created successfully")
      setShowCreateDialog(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization")
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      setSelectedOrganization(data)
      setShowEditDialog(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization")
    }
  }

  const handleUpdateSubmit = async (data: any) => {
    try {
      const result = await updateOrganization(selectedOrganization.id, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) =>
        prev.map((org) => (org.id === selectedOrganization.id ? { ...org, ...result.data } : org))
      )
      toast.success("Organization updated successfully")
      setShowEditDialog(false)
      setSelectedOrganization(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) => prev.filter((org) => org.id !== id))
      toast.success("Organization deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete organization")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <OrganizationTable
        data={organizations}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new organization.
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm
            mode="create"
            closeDialog={() => setShowCreateDialog(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization's information.
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm
            mode="edit"
            initialData={selectedOrganization}
            closeDialog={() => {
              setShowEditDialog(false)
              setSelectedOrganization(null)
            }}
            onSubmit={handleUpdateSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 