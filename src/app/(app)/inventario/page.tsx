import { InventoryManager } from "@/features/inventory/table/inventory-manager"
import { getInventoryItems } from "@/features/inventory/view/actions"


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