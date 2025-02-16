import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
// features/inventory/alert-service.ts
export async function checkStockAlerts() {
    const lowStockItems = await db.query.inventoryItems.findMany({
      where: (items, { lt }) => lt(items.currentStock, items.minimumStock)
    });
  
    return lowStockItems.map(item => ({
      type: 'LOW_STOCK' as const,
      itemId: item.id,
      message: `${item.name} está por debajo del stock mínimo (${item.currentStock}/${item.minimumStock})`
    }));
  }