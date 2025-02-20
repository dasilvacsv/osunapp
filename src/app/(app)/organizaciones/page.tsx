// app/(app)/organizaciones/page.tsx
import OrganizationList from "@/features/organizations/organization-list"
import { getOrganizations } from "@/app/(app)/clientes/organizations"
import { checkPermissions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
  const hasPermission = await checkPermissions('organizations:read')
  if (!hasPermission) {
    redirect('/dashboard')
  }

  const { data, error } = await getOrganizations()
  
  return (
    <div className="container mx-auto px-4 py-6">
      <OrganizationList 
        initialOrganizations={data || []} 
        error={error}
      />
    </div>
  )
}