// app/(app)/clientes/page.tsx

import ClientList from "@/features/clients/client-list"
import type { Client } from "@/lib/types"
import { getClients } from "./client"
import { checkOverdueClients } from "./client-payment-actions"

export const dynamic = "force-dynamic"

export default async function ClientPage() {
  // Check for overdue clients on page load
  await checkOverdueClients()

  const { data } = await getClients()

  // Ensure we always pass an array, even if empty
  const initialClients: Client[] = data || []

  return <ClientList initialClients={initialClients} />
}

