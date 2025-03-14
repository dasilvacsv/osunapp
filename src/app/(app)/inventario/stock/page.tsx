import { UnifiedInventoryForm } from "@/features/inventory/stock/unified-inventory-form"
import { getInventoryItems } from "@/features/inventory/actions"

export default async function InventoryPage() {
  const result = await getInventoryItems()
  // Ensure we have a valid array of items
  const items = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Inventario</h1>
      <UnifiedInventoryForm items={items} />
    </div>
  )
}

