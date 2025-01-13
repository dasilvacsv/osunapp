'use client'

import React, { useCallback, useState, useTransition } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientTable } from "./client-table"
import { ClientForm } from "./create-client-form"
import { ClientFormData, createClient, deleteClient, updateClient } from "@/app/(app)/clientes/client"


interface ClientListProps {
  initialClients: Client[]
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const refreshClients = useCallback((newClients: Client[]) => {
    setClients(newClients)
  }, [])

  const handleCreateClient = useCallback(async (data: ClientFormData) => {
    startTransition(async () => {
      const result = await createClient(data) // Server action call happens here
      if (result.success && result.data) {
        setShowCreateDialog(false)
        setClients(prev => [...prev, result.data]) // Optimistic update
      } else {
        console.error(result.error)
      }
    })
  }, [])
  
  const handleUpdateClient = useCallback(async (id: string, data: ClientFormData) => {
    startTransition(async () => {
      const result = await updateClient(id, data)
      if (result.success && result.data) {
        setClients(prev => 
          prev.map(client => 
            client.id === id ? { ...client, ...result.data } : client
          )
        )
      } else {
        console.error(result.error)
      }
    })
  }, [])

  const handleDeleteClient = useCallback(async (id: string) => {
    startTransition(async () => {
      const result = await deleteClient(id)
      if (result.success) {
        refreshClients(clients.filter(client => client.id !== id))
      } else {
        console.error(result.error)
      }
    })
  }, [clients, refreshClients])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Client
          </Button>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <ClientForm 
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            onSubmit={handleCreateClient} // Pass the handler to ClientForm
          />
        </DialogContent>
      </Dialog>

      <ClientTable
        clients={clients}
        isLoading={isPending}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={handleDeleteClient}
        selectedClients={selectedClients}
        setSelectedClients={setSelectedClients}
      />
    </div>
  )
}

