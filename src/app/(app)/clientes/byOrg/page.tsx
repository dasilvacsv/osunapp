// app/(app)/clientes/page.tsx

import { getOrganizationsWithClients } from "@/features/clients/byorg/actions";
import { OrganizationList } from "@/features/clients/byorg/client-listbyOrg";


export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const clients2 = await getOrganizationsWithClients();

  return <OrganizationList initialData={clients2}/>;
}