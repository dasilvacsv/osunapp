"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "@/features/organizations/organization-form"
import { createOrganization } from "@/features/organizations/actions"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getOrganizations } from "@/features/sales/new/actions"

export interface Organization {
  id: string
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  status: "ACTIVE" | "INACTIVE"
  nature?: "PUBLIC" | "PRIVATE"
}

interface OrganizationSelectProps {
  selectedOrganizationId: string
  onOrganizationSelect: (orgId: string, org: Organization) => void
  initialOrganizations?: Organization[]
}

export function OrganizationSelect({
  selectedOrganizationId,
  onOrganizationSelect,
  initialOrganizations = []
}: OrganizationSelectProps) {
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true)
      try {
        const result = await getOrganizations()
        if (result.success && result.data) {
          setOrganizations(result.data.map(o => ({
            id: o.id,
            name: o.name,
            type: o.type,
            status: o.status,
            nature: o.nature
          })))
        }
      } catch (error) {
        console.error("Error cargando organizaciones:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Hubo un error al cargar las organizaciones"
        })
      } finally {
        setLoading(false)
      }
    }

    if (initialOrganizations.length === 0) loadOrganizations()
  }, [initialOrganizations, toast])

  const handleCreateOrganization = async (data: any) => {
    try {
      const result = await createOrganization(data)
      if (result.success && result.data) {
        const newOrg: Organization = {
          id: result.data.id,
          name: result.data.name,
          type: result.data.type,
          status: "ACTIVE",
          nature: result.data.nature
        }
        
        setOrganizations(prev => [...prev, newOrg])
        onOrganizationSelect(newOrg.id, newOrg)
        setShowCreateDialog(false)
        
        toast({
          title: "Enhorabuena",
          description: "Organización creada con éxito"
        })
      }
    } catch (error) {
      console.error("Error al crear organización:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al crear la organización"
      })
    }
  }

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear una nueva organización</DialogTitle>
          </DialogHeader>
          <OrganizationForm
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            onSubmit={handleCreateOrganization}
          />
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        <div className="flex-1">
          <PopoverSelect
            options={organizations.map(org => ({
              label: `${org.name} (${org.type})${org.nature ? ` - ${org.nature}` : ''}`,
              value: org.id
            }))}
            value={selectedOrganizationId}
            onValueChange={(value) => {
              const org = organizations.find(o => o.id === value)
              if (org) onOrganizationSelect(value, org)
            }}
            placeholder={loading ? "Cargando organizaciones..." : "Selecciona una organización"}
            disabled={loading}
            emptyMessage="No se encontraron organizaciones"
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}