"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BeneficiaryForm } from "@/features/clients/beneficiary-form"
import { createBeneficiary, BeneficiaryFormData } from "@/app/(app)/clientes/client"
import { getOrganizations } from "./actions"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Organization as LibOrganization } from "@/lib/types"

interface Organization {
  id: string
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  address: string | null
  contactInfo: unknown
  status: "ACTIVE" | "INACTIVE" | null
  nature: "PUBLIC" | "PRIVATE" | null
  cityId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface Beneficiary {
  id: string
  name: string
  clientId: string
  organizationId: string | null
  grade: string | null
  section: string | null
  status: "ACTIVE" | "INACTIVE" | null
  bundleId: string | null
  firstName: string | null
  lastName: string | null
  school: string | null
  level: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

interface BeneficiarySelectProps {
  selectedBeneficiaryId: string
  onBeneficiarySelect: (beneficiaryId: string, beneficiary: Beneficiary) => void
  className?: string
  clientId?: string
  organizationId?: string
  beneficiaries: Beneficiary[]
}

export function BeneficiarySelect({
  selectedBeneficiaryId,
  onBeneficiarySelect,
  className,
  clientId,
  organizationId,
  beneficiaries = []
}: BeneficiarySelectProps) {
  console.log("BeneficiarySelect props:", {
    clientId,
    organizationId,
    beneficiariesLength: beneficiaries?.length,
    beneficiaries
  })
  
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])

  // Show loading state when beneficiaries are being loaded
  useEffect(() => {
    if (clientId) {
      setLoading(true)
      // Small timeout to prevent flickering for fast loads
      const timeout = setTimeout(() => {
        setLoading(false)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [clientId])

  // Load organizations when dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      const loadOrganizations = async () => {
        try {
          const result = await getOrganizations()
          if (result.data) {
            setOrganizations(result.data)
          }
        } catch (error) {
          console.error("Failed to load organizations:", error)
        }
      }
      loadOrganizations()
    }
  }, [showCreateDialog])

  // Convert organizations to the format expected by BeneficiaryForm
  const convertedOrganizations: LibOrganization[] = organizations.map(org => ({
    id: org.id,
    name: org.name,
    type: org.type,
    address: org.address || undefined,
    contactInfo: org.contactInfo ? {
      email: (org.contactInfo as any)?.email,
      phone: (org.contactInfo as any)?.phone
    } : undefined,
    status: org.status || "ACTIVE",
    createdAt: org.createdAt || new Date(),
    updatedAt: org.updatedAt || new Date()
  }))

  // Handle beneficiary creation
  const handleCreateBeneficiary = async (data: BeneficiaryFormData) => {
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a client first"
      })
      return
    }

    try {
      const result = await createBeneficiary(data)
      if (result.success && result.data) {
        onBeneficiarySelect(result.data.id, result.data)
        setShowCreateDialog(false)
        toast({
          title: "Success",
          description: "Beneficiary created successfully"
        })
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (error) {
      console.error("Failed to create beneficiary:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create beneficiary"
      })
    }
  }

  // Handle beneficiary selection
  const handleBeneficiaryChange = (value: string) => {
    const selectedBeneficiary = beneficiaries.find(ben => ben.id === value)
    if (selectedBeneficiary) {
      onBeneficiarySelect(value, selectedBeneficiary)
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
            <DialogTitle>Create New Beneficiary</DialogTitle>
          </DialogHeader>
          <BeneficiaryForm
            clientId={clientId || ""}
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            organizations={convertedOrganizations}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={beneficiaries.map(ben => ({
                label: `${ben.name}${ben.grade ? ` - ${ben.grade}${ben.section ? ben.section : ''}` : ''}`,
                value: ben.id
              }))}
              value={selectedBeneficiaryId}
              onValueChange={handleBeneficiaryChange}
              placeholder={loading ? "Loading beneficiaries..." : clientId ? "Select a beneficiary" : "Please select a client first"}
              disabled={loading || !clientId}
              emptyMessage={loading ? "Loading..." : clientId ? "No beneficiaries found" : "Please select a client first"}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCreateDialog(true)}
            disabled={!clientId}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
} 