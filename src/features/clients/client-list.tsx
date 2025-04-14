'use client'

import React, { useCallback, useState, useTransition } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientTable } from "./client-table"
import { ClientForm } from "./create-client-form"
import { ClientFormData, createClient, deleteClient, updateClient } from "@/app/(app)/clientes/client"
import { useRouter } from "next/navigation"

interface ClientListProps {
  initialClients: Client[]
}

export default function ClientList({ initialClients }: ClientListProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const refreshClients = useCallback((newClients: Client[]) => {
    setClients(newClients)
  }, [])

  const handleCreateClient = useCallback(async (data: ClientFormData) => {
    startTransition(async () => {
      try {
        const result = await createClient(data)
        if (result?.id) {
          setShowCreateDialog(false)
          setClients(prev => [...prev, result])
          router.push(`/clientes/${result.id}/beneficiarios`) // Ruta absoluta
        }
      } catch (error) {
        console.error("Error creating client:", error)
      }
    })
  }, [router])

  const handleUpdateClient = useCallback(async (id: string, data: ClientFormData) => {
    startTransition(async () => {
      try {
        const result = await updateClient(id, data)
        if (result?.id) {
          setClients(prev => 
            prev.map(client => 
              client.id === id ? { ...client, ...result } : client
            )
          )
        }
      } catch (error) {
        console.error("Error updating client:", error)
      }
    })
  }, [])

  const handleDeleteClient = useCallback(async (id: string) => {
    startTransition(async () => {
      try {
        await deleteClient(id)
        refreshClients(clients.filter(client => client.id !== id))
      } catch (error) {
        console.error("Error deleting client:", error)
      }
    })
  }, [clients, refreshClients])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-start items-center gap-4 bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            disabled={isPending}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            {isPending ? "Procesando..." : "Crear Cliente"}
          </Button>
        </div>
      </div>

      {/* Create Client Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm 
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            onSubmit={handleCreateClient}
            isSubmitting={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Clients Table */}
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