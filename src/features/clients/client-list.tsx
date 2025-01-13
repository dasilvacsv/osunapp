'use client'

import React, { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientTable } from "./client-table"
import { ClientForm } from "./create-client-form"



interface ClientListProps {
  initialClients: Client[]
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients] = useState<Client[]>(initialClients)
  const [isLoading] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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
          <ClientForm closeDialog={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      <ClientTable
        clients={clients}
        isLoading={isLoading}
        onClientsUpdated={() => {
          // Server actions will handle the revalidation
        }}
        selectedClients={selectedClients}
        setSelectedClients={setSelectedClients}
      />
    </div>
  )
}