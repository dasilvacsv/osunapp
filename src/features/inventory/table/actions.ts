"use server"

import { db } from "@/db"
import { inventoryTransactions, inventoryItems } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function getInventoryTransactions(itemId: string) {
  try {
    const transactions = await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.itemId, itemId))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(10)

    return { success: true, data: transactions }
  } catch (error) {
    console.error("Error fetching transaction history:", error)
    return { success: false, error: "Failed to fetch transaction history" }
  }
}

// Funciones para manejar la pre-venta
export async function updateItemPreSaleFlag(itemId: string, allowPreSale: boolean) {
  try {
    // Actualizar directamente el campo allowPreSale
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        allowPreSale,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))
      .returning()

    return { success: true, data: updatedItem }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Error al actualizar el estado de pre-venta" }
  }
}

