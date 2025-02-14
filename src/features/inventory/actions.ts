'use server'

import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { 
  CreateInventoryItemInput, 
  StockTransactionInput, 
  UpdateInventoryItemInput 
} from "./types";
import { inventoryItemSchema, stockTransactionSchema } from "./validation";
import { z } from "zod";

export async function createInventoryItem(input: CreateInventoryItemInput) {
  try {
    // Validate input
    const validated = inventoryItemSchema.parse(input);
    
    const [item] = await db.insert(inventoryItems).values(validated).returning();
    
    revalidatePath('/inventory');
    return { success: true, data: item };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof z.ZodError 
        ? "Invalid input data" 
        : "Failed to create inventory item"
    };
  }
}

export async function getInventoryItems() {
  try {
    const items = await db.select().from(inventoryItems);
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: 'Failed to fetch inventory items' };
  }
}

export async function stockIn({ itemId, quantity, notes }: StockTransactionInput) {
  try {
    const validated = stockTransactionSchema.parse({ itemId, quantity, notes });
    await db.transaction(async (tx) => {
      // Update inventory item
      await tx
        .update(inventoryItems)
        .set({ 
          currentStock: inventoryItems.currentStock + quantity,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, itemId));

      // Create transaction record
      await tx.insert(inventoryTransactions).values({
        itemId,
        quantity,
        transactionType: 'IN',
        notes
      });
    });

    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to process stock-in transaction' };
  }
}

export async function stockOut({ itemId, quantity, notes }: StockTransactionInput) {
  try {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (item.currentStock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    await db.transaction(async (tx) => {
      // Update inventory item
      await tx
        .update(inventoryItems)
        .set({ 
          currentStock: item.currentStock - quantity,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, itemId));

      // Create transaction record
      await tx.insert(inventoryTransactions).values({
        itemId,
        quantity: -quantity,
        transactionType: 'OUT',
        notes
      });
    });

    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to process stock-out transaction' };
  }
} 