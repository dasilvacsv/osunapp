// app/(app)/clientes/page.tsx

import ClientList from "@/features/clients/client-list";
import { Client } from "@/lib/types";
import { getClients } from "./client";
import { getOrganizationsWithClients } from "@/features/clients/byorg/actions";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const { data } = await getClients();

  // Ensure we always pass an array, even if empty
  const initialClients: Client[] = data || [];
  const clients2 = await getOrganizationsWithClients();

  return <ClientList initialClients={initialClients} data={clients2}/>;
}