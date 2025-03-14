import { InventoryManager } from "@/features/inventory/inventory-manager"
import { getInventoryItems } from "@/features/inventory/actions"

export const dynamic = "force-dynamic"


export default async function InventoryPage() {
  const {data: items} = await getInventoryItems() || { data: [] }

  
  return (
    <div className="container mx-auto py-6">
      <InventoryManager initialData={items} />
    </div>
  )
} 