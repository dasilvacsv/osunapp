import { getInventoryItems } from "@/features/inventory/actions"
import { InventoryManager } from "@/features/inventory/inventory-manager"

export default async function InventoryPage() {
  const { data: items } = await getInventoryItems()
  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager initialData={items || []} />
    </div>
  )
} 