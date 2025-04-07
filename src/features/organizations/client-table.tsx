"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation" // Importar useRouter
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
  const router = useRouter() // Añadir router para la redirección

  const handleCreate = async (data: any) => {
    try {
      const result = await createOrganization(data)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) => [...prev, result.data])
      toast.success("Organización creada exitosamente")
      setShowCreateDialog(false)

      // Redirigir a la página de secciones de la organización recién creada
      router.push(`/organizations/${result.data.id}/sections`)
    } catch (error: any) {
      toast.error(error.message || "Error al crear la organización")
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      setSelectedOrganization(data)
      setShowEditDialog(true)
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la organización")
    }
  }

  const handleUpdateSubmit = async (data: any) => {
    try {
      const result = await updateOrganization(selectedOrganization.id, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) =>
        prev.map((org) => (org.id === selectedOrganization.id ? { ...org, ...result.data } : org)),
      )
      toast.success("Organización actualizada exitosamente")
      setShowEditDialog(false)
      setSelectedOrganization(null)
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la organización")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      setOrganizations((prev) => prev.filter((org) => org.id !== id))
      toast.success("Organización eliminada exitosamente")
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la organización")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organizaciones</h2>
        <Button onClick={() => setShowCreateDialog(true)} className="ml-4">
          <Plus className="mr-2 h-4 w-4" /> Añadir Organización
        </Button>
      </div>

      <OrganizationTable data={organizations} onUpdate={handleUpdate} onDelete={handleDelete} />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Organización</DialogTitle>
            <DialogDescription>Complete el formulario para crear una nueva organización.</DialogDescription>
          </DialogHeader>
          <OrganizationForm mode="create" closeDialog={() => setShowCreateDialog(false)} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Organización</DialogTitle>
            <DialogDescription>Actualice la información de la organización.</DialogDescription>
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

