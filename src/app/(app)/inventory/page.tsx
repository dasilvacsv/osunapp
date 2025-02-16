import { getInventoryItems, getBundleCategories } from "@/features/inventory/actions"
import { InventoryManager } from "@/features/inventory/inventory-manager"

export default async function InventoryPage() {
  const [itemsResult, categoriesResult] = await Promise.all([
    getInventoryItems(),
    getBundleCategories()
  ])
  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager 
        initialData={itemsResult.data || []}
        bundleCategories={categoriesResult.data || []}
      />
    </div>
  )
} 