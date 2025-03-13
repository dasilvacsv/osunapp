import { TestComponent } from "@/features/bundles/new/comp"
import { getBundleCategories, getOrganizations } from "@/features/bundles/new/actions"

export default async function InventoryPage() {
  const {data: categories} = await getBundleCategories() || { data: [] }
  const {data: organizations} = await getOrganizations() || { data: [] }

  return (
    <div className="container mx-auto py-6">
      <TestComponent 
        organizations={organizations || []} 
        categories={categories || []} 
      />
    </div>
  )
} 