'use client'
// app/clients/components/ClientList.tsx
import React, { useState, useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Client } from "@/lib/types"
import { ClientTable } from "./client-table"

interface ClientListProps {
  initialClients: Client[]
}

export default function ClientList({ initialClients }: ClientListProps) {
  console.log(initialClients);
  
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const { toast } = useToast()

  const handleClientsUpdated = useCallback(() => {
    // Implement refresh logic here
    console.log("Refreshing clients...")
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <div className="flex items-center gap-4">
          <Link href="/clients/create">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Client
            </Button>
          </Link>
        </div>
      </div>

      <ClientTable
        clients={clients}
        isLoading={isLoading}
        onClientsUpdated={handleClientsUpdated}
        selectedClients={selectedClients}
        setSelectedClients={setSelectedClients}
      />
    </div>
  )
}