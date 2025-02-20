// app/(app)/clientes/page.tsx

import { getOrganizationsWithClients } from "@/features/clients/byorg/actions";
import ClientList from "@/features/clients/byorg/client-listbyOrg";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const clients2 = await getOrganizationsWithClients();

  return <ClientList data={clients2}/>;
}