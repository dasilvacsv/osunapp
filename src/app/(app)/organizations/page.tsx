import { ClientTable } from "@/features/organizations/client-table"
import { getOrganizations } from "@/features/organizations/organization"

export default async function OrganizationsPage() {
  const { data: organizations } = await getOrganizations()

  return (
    <div className="container py-6">
      <ClientTable initialOrganizations={organizations} />
    </div>
  )
}

