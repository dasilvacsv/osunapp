import { TestComponent } from "@/features/bundles/view/comp"
import { getInventoryItems, getBundleCategories } from "@/features/inventory/actions"





export default async function InventoryPage() {
  const {data: categories} = await getBundleCategories()

  return (
    <div className="container mx-auto py-6">
      <TestComponent data={categories} />
    </div>
  )
} 