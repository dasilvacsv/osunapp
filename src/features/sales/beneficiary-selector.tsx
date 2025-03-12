"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBeneficiariesByClient } from "@/app/(app)/clientes/client"
import { Beneficiary } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface BeneficiarySelectorProps {
  clientId: string | null
  onBeneficiarySelect: (beneficiary: Beneficiary | null) => void
  selectedBeneficiary: Beneficiary | null
  onCreateBeneficiary?: () => void
}

export function BeneficiarySelector({
  clientId,
  onBeneficiarySelect,
  selectedBeneficiary,
  onCreateBeneficiary,
}: BeneficiarySelectorProps) {
  const [open, setOpen] = useState(false)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(false)

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
    if (selectedBeneficiary && clientId !== selectedBeneficiary.clientId) {
      onBeneficiarySelect(null)
    }
  }, [clientId, selectedBeneficiary, onBeneficiarySelect])

  return (
    <div className="flex gap-2 items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full"
            disabled={!clientId}
          >
            {selectedBeneficiary && selectedBeneficiary.name ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{selectedBeneficiary.name}</span>
                {selectedBeneficiary.grade && selectedBeneficiary.section && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {selectedBeneficiary.grade} - {selectedBeneficiary.section}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                {clientId ? "Seleccionar beneficiario" : "Seleccione un cliente primero"}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput placeholder="Buscar beneficiario..." />
            <CommandList>
              {loading ? (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {clientId ? (
                      <div className="flex flex-col items-center justify-center py-3 text-center">
                        <p className="text-sm text-muted-foreground">No se encontraron beneficiarios</p>
                        {onCreateBeneficiary && (
                          <Button variant="link" size="sm" onClick={onCreateBeneficiary} className="mt-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear nuevo beneficiario
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        Seleccione un cliente primero
                      </p>
                    )}
                  </CommandEmpty>
                  
                  {Array.isArray(beneficiaries) && beneficiaries.length > 0 && (
                    <CommandGroup heading="Beneficiarios">
                      {beneficiaries.map((beneficiary) => (
                        <CommandItem
                          key={beneficiary.id}
                          value={beneficiary.id}
                          data-value={beneficiary.id}
                          onSelect={() => {
                            onBeneficiarySelect(beneficiary)
                            setOpen(false)
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedBeneficiary?.id === beneficiary.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{beneficiary.name || `${beneficiary.firstName} ${beneficiary.lastName}`}</span>
                            </div>
                            {beneficiary.grade && beneficiary.section && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {beneficiary.grade} - {beneficiary.section}
                              </Badge>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {onCreateBeneficiary && clientId && (
        <Button
          variant="outline"
          size="icon"
          onClick={onCreateBeneficiary}
          className="shrink-0"
          title="Crear nuevo beneficiario"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 