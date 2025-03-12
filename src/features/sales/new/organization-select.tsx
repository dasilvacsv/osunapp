"use client"

import { useState, useCallback } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getOrganizations } from "./actions"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "@/features/organizations/organization-form"
import { createOrganization } from "@/app/(app)/organizations/organization"
import { PlusIcon } from "lucide-react"

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
  onContinue: () => void
  className?: string
}

export function OrganizationSelect({
  initialOrganizations,
  selectedOrganizationId,
  onOrganizationSelect,
  onContinue,
  className
}: OrganizationSelectProps) {
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
      }
    } catch (error) {
      console.error("Failed to load organizations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle organization creation
  const handleCreateOrganization = async (data: any) => {
    try {
      const result = await createOrganization(data)
      if (result.data) {
        await refreshOrganizations()
        // Select the newly created organization
        onOrganizationSelect(result.data.id, result.data)
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
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

      <Card className={className}>
        <CardHeader>
          <CardTitle>Select Organization</CardTitle>
          <CardDescription>Choose the organization for this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="organization">Organization</Label>
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
            
            {selectedOrganizationId && (
              <Button 
                type="button" 
                className="w-full"
                onClick={onContinue}
              >
                Continue with Selected Organization
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
} 