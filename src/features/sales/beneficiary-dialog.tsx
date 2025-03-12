"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BeneficiaryForm } from "@/features/clients/beneficiary-form"
import { useToast } from "@/hooks/use-toast"
import { Organization, Beneficiary } from "@/lib/types"
import { createBeneficiary } from "@/app/(app)/clientes/client"

interface BeneficiaryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (beneficiary: Beneficiary) => void
  clientId: string | null
  organizations: Organization[]
}

export function BeneficiaryDialog({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  organizations
}: BeneficiaryDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (data: any) => {
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un cliente primero",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createBeneficiary({ ...data, clientId })
      
      if (result.success && result.data) {
        // Create a properly typed beneficiary object
        const newBeneficiary = {
          ...result.data,
          status: result.data.status || "ACTIVE",
          organization: result.data.organizationId && result.data.organizationId !== 'none'
            ? organizations.find(o => o.id === result.data.organizationId)
            : undefined
        } as Beneficiary

        onSuccess(newBeneficiary)
        
        toast({
          title: "¡Éxito!",
          description: "Beneficiario creado correctamente",
        })
        
        onClose()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "No se pudo crear el beneficiario",
        })
      }
    } catch (error) {
      console.error("Error creating beneficiary:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close the dialog if there's no client selected
  useEffect(() => {
    if (isOpen && !clientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un cliente primero",
      })
      onClose()
    }
  }, [isOpen, clientId, onClose, toast])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Beneficiario</DialogTitle>
        </DialogHeader>
        {clientId && (
          <BeneficiaryForm
            clientId={clientId}
            closeDialog={onClose}
            mode="create"
            organizations={organizations}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 