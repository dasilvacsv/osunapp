import { getInventoryItems } from "@/features/inventory/actions"
import { InventoryLogger } from "@/features/inventory/inventory-logger"

export default async function InventoryPage() {
  const { data } = await getInventoryItems() // Fetch all inventory items
  return <InventoryLogger data={data} />
} 