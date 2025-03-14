"use client"

import { useState, useCallback } from "react"
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
  status: "ACTIVE" | "INACTIVE" | null
  address: string | null
  contactInfo: unknown
  nature: "PUBLIC" | "PRIVATE" | null
  createdAt: Date | null
  updatedAt: Date | null
  cityId: string | null
}

interface OrganizationSelectProps {
  initialOrganizations: Organization[]
  selectedOrganizationId: string
  onOrganizationSelect: (organizationId: string, organization: Organization) => void
  className?: string
}

export function OrganizationSelect({
  initialOrganizations,
  selectedOrganizationId,
  onOrganizationSelect,
  className
}: OrganizationSelectProps) {
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Refresh organizations list
  const refreshOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getOrganizations()
      if (result.data) {
        setOrganizations(result.data)
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (error) {
      console.error("Failed to load organizations:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load organizations"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Handle organization creation
  const handleCreateOrganization = async (data: any) => {
    try {
      const result = await createOrganization(data)
      if (result.success && result.data) {
        await refreshOrganizations()
        // Select the newly created organization
        onOrganizationSelect(result.data.id, result.data)
        setShowCreateDialog(false)
        toast({
          title: "Success",
          description: result.success
        })
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
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

  // Handle organization selection
  const handleOrganizationChange = (value: string) => {
    const selectedOrg = organizations.find(org => org.id === value)
    if (selectedOrg) {
      onOrganizationSelect(value, selectedOrg)
    }
  }

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent 
          className="sm:max-w-[500px]" 
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
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

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={organizations.map(org => ({
                label: `${org.name} (${org.type})`,
                value: org.id
              }))}
              value={selectedOrganizationId}
              onValueChange={handleOrganizationChange}
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
      </div>
    </>
  )
} 