// app/(app)/clientes/page.tsx

import ClientList from "@/features/clients/client-list"
import { Client } from "@/lib/types"
import { getClients } from "./client"


export const dynamic = 'force-dynamic'

export default async function ClientPage() {
  const { data } = await getClients()
  
  // Ensure we always pass an array, even if empty
  const initialClients: Client[] = data || []

  return (
    <div className="container mx-auto px-4">
      <ClientList initialClients={initialClients} />
    </div>
  )
}