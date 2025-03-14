import { getInventoryItems } from "@/features/inventory/view/actions"
import { InventoryManager } from "@/features/inventory/view/inventory-manager"

export default async function InventoryPage() {
  // Fetch inventory items with error handling
  const inventoryResult = await getInventoryItems() || { data: [], success: false }
  const items = inventoryResult.data || []
  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager 
        initialData={items}
      />
    </div>
  )
} 