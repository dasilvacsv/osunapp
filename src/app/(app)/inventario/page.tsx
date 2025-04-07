import { InventoryManager } from "@/features/inventory/inventory-manager"
import { getInventoryItems } from "@/features/inventory/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  // Obtener datos de inventario para el componente InventoryManager
  const itemsResult = await getInventoryItems()
  const items = itemsResult.success ? itemsResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Inventario</h1>

      {/* Enlaces a secciones principales */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
          <Link href="/inventario/bundles">
            <Package className="h-5 w-5" />
            <span>Gestionar Paquetes</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
          <Link href="/inventario/compras">
            <ShoppingBag className="h-5 w-5" />
            <span>Gestionar Compras</span>
          </Link>
        </Button>
      </div>

      {/* Componente original de InventoryManager */}
      <InventoryManager initialData={items} />
    </div>
  )
}

