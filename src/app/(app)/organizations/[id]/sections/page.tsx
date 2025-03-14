import { getOrganizationSections } from "@/features/organizations/actions"
import { OrganizationSectionsList } from "@/features/organizations/organization-sections-list"

interface SectionsPageProps {
  params: {
    id: string
  }
}

export default async function SectionsPage({ params }: SectionsPageProps) {
  const { data: sections } = await getOrganizationSections(params.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Secciones</h2>
      </div>
      <OrganizationSectionsList organizationId={params.id} initialSections={sections || []} />
    </div>
  )
} 