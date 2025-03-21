import { BundleCreationForm } from "@/features/bundles/new/comp"
import { getBundleCategories, getOrganizations, getInventoryItems } from "@/features/bundles/new/actions"
import { TestComponent } from "@/components/comp"

export default async function InventoryPage() {
  const {data: categories} = await getBundleCategories() || { data: [] }
  const {data: organizations} = await getOrganizations() || { data: [] }
  const {data: items} = await getInventoryItems() || { data: [] }
  return (
    <div className="container mx-auto py-6">
      <BundleCreationForm 
        organizations={organizations || []} 
        categories={categories || []} 
        items={items || []}
      />

    </div>
  )
} 