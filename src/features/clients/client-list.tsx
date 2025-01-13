'use client'

import React, { useCallback, useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientTable } from "./client-table"
import { ClientForm } from "./create-client-form"
import { useRouter } from "next/navigation"

interface ClientListProps {
  initialClients: Client[]
}

export default function ClientList({ initialClients }: ClientListProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Function to refresh data
  const refreshData = useCallback(() => {
    setIsLoading(true)
    // This will trigger a server-side revalidation
    router.refresh()
    setIsLoading(false)
  }, [router])

  // Function to handle dialog close and data refresh
  const handleDialogClose = useCallback(() => {
    setShowCreateDialog(false)
    refreshData()
  }, [refreshData])

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
            closeDialog={handleDialogClose}
            mode="create" 
          />
        </DialogContent>
      </Dialog>

      <ClientTable
        clients={clients}
        isLoading={isLoading}
        onClientsUpdated={refreshData}
        selectedClients={selectedClients}
        setSelectedClients={setSelectedClients}
      />
    </div>
  )
}