"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "@/features/clients/create-client-form"
import { createClient } from "@/app/(app)/clientes/client"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClients } from "@/features/sales/new/actions"

export interface Client {
  id: string
  name: string
  document?: string | null
  phone?: string | null
  organization?: {
    id: string
    name: string
  }
  status: "ACTIVE" | "INACTIVE"
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL"
}

interface ClientSelectProps {
  selectedClientId: string
  onClientSelect: (clientId: string, client: Client) => void
  initialClients?: Client[]
}

export function ClientSelect({
  selectedClientId,
  onClientSelect,
  initialClients = []
}: ClientSelectProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true)
      try {
        const result = await getClients()
        if (result.success && result.data) {
          setClients(result.data
            .filter(c => c.status !== null) // Ensure status is not null
            .map(c => ({
              id: c.id,
              name: c.name,
              document: c.document,
              phone: c.phone,
              status: c.status as "ACTIVE" | "INACTIVE", // Assert non-null status
              role: c.role,
              organization: c.organization
            }))
          )
        }
      } catch (error) {
        console.error("Error loading clients:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load clients"
        })
      } finally {
        setLoading(false)
      }
    }

    if (initialClients.length === 0) loadClients()
  }, [initialClients, toast])

  const handleCreateClient = async (data: any) => {
    try {
      const result = await createClient(data)
      if (result.success && result.data) {
        const newClient: Client = {
          id: result.data.id,
          name: result.data.name,
          document: result.data.document,
          phone: result.data.phone,
          status: "ACTIVE",
          role: result.data.role
        }
        
        setClients(prev => [...prev, newClient])
        onClientSelect(newClient.id, newClient)
        setShowCreateDialog(false)
        
        toast({
          title: "Success",
          description: "Client created successfully"
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
        <DialogContent className="sm:max-w-[500px]">
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

      <div className="flex gap-2">
        <div className="flex-1">
          <PopoverSelect
            options={clients.map(client => ({
              label: [
                client.name,
                client.document && `CI: ${client.document}`,
                client.organization?.name && `Org: ${client.organization.name}`
              ].filter(Boolean).join(" - "),
              value: client.id,
              }))
            }
              value={selectedClientId}
            onValueChange={(value) => {
              const client = clients.find(c => c.id === value)
              if (client) onClientSelect(value, client)
            }}
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
    </>
  )
}