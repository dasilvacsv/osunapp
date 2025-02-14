'use server';

import { db } from '@/db';
import { inventoryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CreateInventoryItemInput, UpdateInventoryItemInput, StockLevelUpdate } from './types';

// ... (previous CRUD operations remain unchanged)

export async function updateStockLevel(data: StockLevelUpdate) {
  try {
    const item = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.itemId))
      .limit(1);

    if (!item[0]) {
      return { success: false, error: 'Item not found' };
    }

    let newStock = item[0].currentStock || 0;
    
    switch (data.adjustmentType) {
      case 'INCREMENT':
        newStock += data.quantity;
        break;
      case 'DECREMENT':
        newStock -= data.quantity;
        break;
      case 'SET':
        newStock = data.quantity;
        break;
    }

    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ currentStock: newStock })
      .where(eq(inventoryItems.id, data.itemId))
      .returning();

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${data.itemId}`);
    return { success: true, data: updatedItem };
  } catch (error) {
    return { success: false, error: 'Failed to update stock level' };
  }
}

export async function getLowStockItems() {
  try {
    const items = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.status, 'ACTIVE'))
      .where(eq(inventoryItems.currentStock, inventoryItems.minimumStock))
      .orderBy(inventoryItems.name);

    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: 'Failed to fetch low stock items' };
  }
}

export async function getInventoryHistory(itemId: string) {
  try {
    const history = await db
      .select()
      .from(inventoryHistory)
      .where(eq(inventoryHistory.itemId, itemId))
      .orderBy(inventoryHistory.createdAt);

    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: 'Failed to fetch inventory history' };
  }
}