// app/(app)/organizaciones/page.tsx
import OrganizationList from "@/features/organizations/organization-list"
import { getOrganizations } from "@/app/(app)/clientes/organizations"

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
  const { data } = await getOrganizations()
  
  return (
    <div className="container mx-auto px-4">
      <OrganizationList initialOrganizations={data || []} />
    </div>
  )
}