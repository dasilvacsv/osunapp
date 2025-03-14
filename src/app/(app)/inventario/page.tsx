import { InventoryManager } from "@/features/inventory/inventory-manager"
import { getInventoryItems } from "@/features/inventory/actions"

export default async function InventoryPage() {
  const result = await getInventoryItems()
  const items = result.success ? result.data : []
  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager initialData={items} />
    </div>
  )
} 