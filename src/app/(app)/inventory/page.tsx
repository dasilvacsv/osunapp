import { InventoryTable } from "@/features/inventory/inventory-table"
import { getInventoryItems } from "@/features/inventory/actions"

export default async function InventoryPage() {
  const { data, error } = await getInventoryItems()
  
  if (error) {
    return <div>Error loading inventory items: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Inventory</h1>
      <InventoryTable data={data || []} />
    </div>
  )
} 