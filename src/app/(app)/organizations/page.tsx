import OrganizationList from "@/features/organizations/organization-list"
import { getOrganizations } from "./organization"

export const dynamic = 'force-dynamic'

export default async function OrganizationPage() {
  const { data } = await getOrganizations()
  
  const initialOrganizations = data || []

  return (
    <div className="container mx-auto px-4">
      <OrganizationList initialOrganizations={initialOrganizations} />
    </div>
  )
}