"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, Plus } from "lucide-react"
import { getBeneficiariesByClient } from "@/app/(app)/clientes/client"
import { Beneficiary, Organization } from "@/lib/types"
import { BeneficiaryDialog } from "./beneficiary-dialog"
import { PopoverSelect } from "@/components/popover-select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BeneficiarySelectorProps {
  clientId: string | null
  onBeneficiarySelect: (beneficiary: Beneficiary | null) => void
  selectedBeneficiary: Beneficiary | null
  organizations: Organization[]
  disabled?: boolean
  placeholder?: string
}

export function BeneficiarySelector({
  clientId,
  onBeneficiarySelect,
  selectedBeneficiary,
  organizations,
  disabled = false,
  placeholder = "Seleccionar beneficiario"
}: BeneficiarySelectorProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // Convert beneficiaries to the format expected by PopoverSelect
  const beneficiaryOptions = beneficiaries.map(beneficiary => ({
    value: beneficiary.id,
    label: getBeneficiaryDisplayName(beneficiary),
    // Additional data not used by PopoverSelect but useful for us
    data: beneficiary 
  }));

  // Load beneficiaries when clientId changes
  useEffect(() => {
    async function loadBeneficiaries() {
      if (!clientId) {
        setBeneficiaries([])
        return
      }

      setLoading(true)
      try {
        const result = await getBeneficiariesByClient(clientId)
        if (result.success && Array.isArray(result.data)) {
          setBeneficiaries(result.data as Beneficiary[])
        } else {
          setBeneficiaries([])
        }
      } catch (error) {
        console.error("Error fetching beneficiaries:", error)
        setBeneficiaries([])
      } finally {
        setLoading(false)
      }
    }

    loadBeneficiaries()
    
    // Clear selection if client changes
    if (selectedBeneficiary && clientId !== selectedBeneficiary.clientId) {
      onBeneficiarySelect(null)
    }
  }, [clientId, selectedBeneficiary, onBeneficiarySelect])

  // Handle creating a new beneficiary
  const handleAddBeneficiary = () => {
    setShowAddDialog(true)
  }

  // Handle successful beneficiary creation
  const handleAddSuccess = (newBeneficiary: Beneficiary) => {
    setBeneficiaries((prev) => [...prev, newBeneficiary])
    onBeneficiarySelect(newBeneficiary)
  }

  // Format beneficiary display name
  function getBeneficiaryDisplayName(beneficiary: Beneficiary) {
    if (beneficiary.name) return beneficiary.name;
    return `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim();
  }

  // Handle selecting a beneficiary
  const handleSelectBeneficiary = (value: string) => {
    const selected = beneficiaries.find(b => b.id === value);
    if (selected) {
      onBeneficiarySelect(selected);
    }
  };

  // Create custom trigger content to display the badge
  const customTriggerContent = selectedBeneficiary ? (
    <>
      <User className="h-4 w-4 shrink-0" />
      <span className="truncate ml-2">{getBeneficiaryDisplayName(selectedBeneficiary)}</span>
      {selectedBeneficiary.grade && selectedBeneficiary.section && (
        <Badge variant="outline" className="ml-2 text-xs">
          {selectedBeneficiary.grade} - {selectedBeneficiary.section}
        </Badge>
      )}
    </>
  ) : null;

  return (
    <div className={cn("flex gap-2 items-center", loading && "opacity-60")}>
      <PopoverSelect
        options={beneficiaryOptions}
        value={selectedBeneficiary?.id}
        onValueChange={handleSelectBeneficiary}
        onAddItem={clientId ? handleAddBeneficiary : undefined}
        placeholder={clientId ? placeholder : "Seleccione un cliente primero"}
        emptyMessage={clientId ? "No se encontraron beneficiarios" : "Seleccione un cliente primero"}
        disabled={!clientId || disabled || loading}
        triggerContent={customTriggerContent}
      />

      {clientId && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleAddBeneficiary}
          className="shrink-0"
          title="Crear nuevo beneficiario"
          disabled={disabled || loading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      <BeneficiaryDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
        clientId={clientId}
        organizations={organizations}
      />
    </div>
  )
} 