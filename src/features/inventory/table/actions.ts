"use server"

import { db } from "@/db"
import {
  inventoryTransactions,
  inventoryItems,
} from "@/db/schema"
import { eq, desc} from "drizzle-orm"


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
    // Primero obtenemos el item para conseguir su metadata actual
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
    
    if (!item) {
      return { success: false, error: "Item no encontrado" }
    }
    
    // Preparar el nuevo metadata con allowPreSale
    const currentMetadata = item.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      allowPreSale
    }
    
    // Actualizar el item con el nuevo metadata
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date()
      })
      .where(eq(inventoryItems.id, itemId))
      .returning()
    
    return { success: true, data: updatedItem }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Error al actualizar el estado de pre-venta" }
  }
}
