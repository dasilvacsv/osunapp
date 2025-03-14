import { InventoryManager } from "@/features/inventory/inventory-manager"
import { getInventoryItems } from "@/features/inventory/actions"

export default async function InventoryPage() {
  const {data: items} = await getInventoryItems() || { data: [] }

  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager initialData={items} />
    </div>
  )
} 