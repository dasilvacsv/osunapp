import { BundleCreationForm } from "@/features/bundles/new/comp"
import { getBundleCategories, getOrganizations, getInventoryItems } from "@/features/bundles/new/actions"
import { TestComponent } from "@/features/inventory/view/comp"

export default async function InventoryPage() {
  const {data: categories} = await getBundleCategories() || { data: [] }
  const {data: organizations} = await getOrganizations() || { data: [] }
  const {data: items} = await getInventoryItems() || { data: [] }
  const {data: bundles} = await getBundles() || { data: [] }

  return (
    <div className="container mx-auto py-6">
      <BundleCreationForm 
        organizations={organizations || []} 
        categories={categories || []} 
        items={items || []}
      />

      <TestComponent data{bundles}/>
    </div>
  )
} 