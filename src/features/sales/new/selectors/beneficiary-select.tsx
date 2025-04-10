"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { createBeneficiary, BeneficiaryFormData } from "@/app/(app)/clientes/client"
import { getBeneficiariesByClient, getOrganizations } from "@/features/sales/new/actions"
import { PlusIcon } from "lucide-react" 
import { useToast } from "@/hooks/use-toast"
import { Organization as LibOrganization } from "@/lib/types"
import BeneficiaryForm from "@/features/clients/beneficiary-form"

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
  onBeneficiaryCreated: (beneficiary: Beneficiary) => void
  className?: string
  clientId?: string
  organizationId?: string
  beneficiaries: Beneficiary[]
}

export function BeneficiarySelect({
  selectedBeneficiaryId,
  onBeneficiarySelect,
  onBeneficiaryCreated,
  className,
  clientId,
  organizationId,
  beneficiaries = []
}: BeneficiarySelectProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [localBeneficiaries, setLocalBeneficiaries] = useState<Beneficiary[]>(beneficiaries)

  useEffect(() => {
    const loadBeneficiaries = async () => {
      if (!clientId) return
      
      setLoading(true)
      try {
        const result = await getBeneficiariesByClient(clientId)
        if (result.success) {
          setLocalBeneficiaries(result.data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Failed to load beneficiaries"
          })
        }
      } catch (error) {
        console.error("Error cargando beneficiarios:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Hubo un error al cagar los beneficiarios"
        })
      } finally {
        setLoading(false)
      }
    }

    loadBeneficiaries()
  }, [clientId])

  useEffect(() => {
    setLocalBeneficiaries(beneficiaries)
  }, [beneficiaries])

  useEffect(() => {
    if (showCreateDialog) {
      const loadOrganizations = async () => {
        try {
          const result = await getOrganizations()
          if (result.data) {
            setOrganizations(result.data)
          }
        } catch (error) {
          console.error("Error al cargar organizaciones:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Hubo un fallo al cargar las organizaciones"
          })
        }
      }
      loadOrganizations()
    }
  }, [showCreateDialog])

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

  const handleCreateBeneficiary = async (data: BeneficiaryFormData) => {
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un cliente primero"
      })
      return
    }

    try {
      const result = await createBeneficiary({
        ...data,
        clientId
      })
      
      if (result.success && result.data) {
        const newBeneficiary: Beneficiary = {
          id: result.data.id,
          clientId: result.data.clientId,
          organizationId: result.data.organizationId,
          grade: result.data.grade || null,
          section: result.data.section || null,
          status: result.data.status || "ACTIVE",
          bundleId: result.data.bundleId || null,
          firstName: result.data.firstName || null,
          lastName: result.data.lastName || null,
          school: result.data.school || null,
          level: result.data.level || null,
          createdAt: result.data.createdAt || null,
          updatedAt: result.data.updatedAt || null
        }

        onBeneficiaryCreated(newBeneficiary)
        setLocalBeneficiaries(prev => [...prev, newBeneficiary])
        setShowCreateDialog(false)
        
        toast({
          title: "Success",
          description: "Beneficiario creado con éxito"
        })
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (error) {
      console.error("Error al crear beneficiario:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al crear el beneficiario"
      })
    }
  }

  const handleBeneficiaryChange = (value: string) => {
    const selectedBeneficiary = localBeneficiaries.find(ben => ben.id === value)
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
            <DialogTitle>Crear nuevo beneficiario</DialogTitle>
          </DialogHeader>
          <BeneficiaryForm
            clientId={clientId || ""}
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            organizations={convertedOrganizations}
            onSubmit={handleCreateBeneficiary}
          />
        </DialogContent>
      </Dialog>

      <div className={className}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={localBeneficiaries.map(ben => ({
                label: [
                  ben.firstName,
                  ben.lastName,
                  ben.school && `(${ben.school})`,
                  ben.level && `Grado ${ben.level}`,
                  ben.section && `Seccion ${ben.section}`
                ].filter(Boolean).join(' '),
                value: ben.id,
                description: ben.id
              }))}
              value={selectedBeneficiaryId}
              onValueChange={handleBeneficiaryChange}
              placeholder={loading ? "Cargando beneficiarios..." : clientId ? "Selecciona un beneficiario" : "Por favor, selecciona un cliente primero"}
              disabled={loading || !clientId}
              emptyMessage={loading ? "Cargando..." : clientId ? "No se encontraron beneficiarios" : "Por favor, selecciona un cliente primero"}
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