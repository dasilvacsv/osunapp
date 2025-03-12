"use client"

import { useState, useCallback, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "@/features/clients/create-client-form"
import { createClient } from "@/app/(app)/clientes/client"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClientDetail, getClients } from "./actions"

export interface Client {
  id: string
  name: string
  document: string | null
  phone: string | null
  whatsapp: string | null
  contactInfo: unknown
  organizationId: string | null
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL"
  status: "ACTIVE" | "INACTIVE" | null
  createdAt: Date | null
  updatedAt: Date | null
  organization?: {
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
  beneficiarios?: {
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
  }[]
}

interface ClientSelectProps {
  organizationId?: string
  selectedClientId: string
  onClientSelect: (clientId: string, client: Client) => void
  className?: string
  initialClients: Client[]
}

export function ClientSelect({
  organizationId,
  selectedClientId,
  onClientSelect,
  className,
  initialClients
}: ClientSelectProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [loading, setLoading] = useState(false)
  const [selectionLoading, setSelectionLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Refresh clients list
  const refreshClients = async () => {
    setLoading(true)
    try {
      const result = await getClients()
      if (result.data) {
        setClients(result.data)
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (error) {
      console.error("Failed to load clients:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle client selection
  const handleClientChange = async (value: string) => {
    // Optimistically update the selection
    const selectedClient = clients.find(c => c.id === value)
    if (selectedClient) {
      onClientSelect(value, selectedClient)
    }
    
    setSelectionLoading(true)
    // Fetch complete client data when selected
    try {
      const result = await getClientDetail(value)
      if (result.data) {
        // Map children to beneficiarios
        const clientWithBeneficiarios = {
          ...result.data.client,
          beneficiarios: result.data.children || []
        }
        onClientSelect(value, clientWithBeneficiarios)
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error
        })
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch client details"
      })
    } finally {
      setSelectionLoading(false)
    }
  }

  // Handle client creation
  const handleCreateClient = async (data: any) => {
    try {
      // Add organization ID to client data if provided
      const clientData = {
        ...data,
        ...(organizationId && { organizationId })
      }
      
      const result = await createClient(clientData)
      if (result.success && result.data) {
        await refreshClients()
        // Get full client details including beneficiaries
        const detailResult = await getClientDetail(result.data.id)
        if (detailResult.data) {
          // Map children to beneficiarios
          const clientWithBeneficiarios = {
            ...detailResult.data.client,
            beneficiarios: detailResult.data.children || []
          }
          onClientSelect(result.data.id, clientWithBeneficiarios)
        }
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
      console.error("Failed to create client:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create client"
      })
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
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            onSubmit={handleCreateClient}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <PopoverSelect
              options={clients.map(client => ({
                label: `${client.name}${client.document ? ` (${client.document})` : ''}${selectionLoading && client.id === selectedClientId ? ' (Loading...)' : ''}`,
                value: client.id
              }))}
              value={selectedClientId}
              onValueChange={handleClientChange}
              placeholder={loading ? "Loading clients..." : "Select a client"}
              disabled={loading}
              emptyMessage="No clients found"
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