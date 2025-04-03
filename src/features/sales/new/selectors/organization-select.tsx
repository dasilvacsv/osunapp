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
        console.error("Error loading organizations:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load organizations"
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
          title: "Success",
          description: "Organization created successfully"
        })
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create organization"
      })
    }
  }

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
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
            placeholder={loading ? "Loading organizations..." : "Select an organization"}
            disabled={loading}
            emptyMessage="No organizations found"
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