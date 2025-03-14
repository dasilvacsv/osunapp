"use server"

import { db } from "@/db"
import { inventoryItems, inventoryTransactions } from "@/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import type { ActionResponse, InventoryItem, InventoryTransaction } from "./types"

export async function getInventoryItems(): Promise<ActionResponse<InventoryItem[]>> {
  try {
    // First get all inventory items
    const items = await db.select().from(inventoryItems)

    // Then get pre-sale counts for all items in a single query
    const preSaleCounts = await db
      .select({
        itemId: inventoryTransactions.itemId,
        count: sql<number>`COALESCE(SUM(${inventoryTransactions.quantity}), 0)`,
      })
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.transactionType, "RESERVATION"))
      .groupBy(inventoryTransactions.itemId)

    // Create a map of itemId to pre-sale count
    const preSaleCountMap = new Map(
      preSaleCounts.map(({ itemId, count }) => [itemId, Number(count)])
    )

    // Merge the data
    const enrichedItems = items.map(item => ({
      ...item,
      preSaleCount: preSaleCountMap.get(item.id) || 0,
    }))

    return { success: true, data: enrichedItems }
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return { success: false, error: "Failed to fetch inventory items" }
  }
}

export async function getInventoryTransactions(itemId: string): Promise<ActionResponse<InventoryTransaction[]>> {
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

export async function getInventoryItem(id: string): Promise<ActionResponse<InventoryItem>> {
  try {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id))
    if (!item) {
      return { success: false, error: "Item not found" }
    }
    return { success: true, data: item }
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return { success: false, error: "Error fetching item" }
  }
}

export async function updateInventoryItemStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<ActionResponse<void>> {
  try {
    await db
      .update(inventoryItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating item status:", error)
    return { success: false, error: "Failed to update item status" }
  }
}

export async function updatePreSaleFlag(id: string, allowPreSale: boolean): Promise<ActionResponse<void>> {
  try {
    await db
      .update(inventoryItems)
      .set({ allowPreSale, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Failed to update pre-sale setting" }
  }
} 