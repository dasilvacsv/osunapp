'use server'

import { db } from "@/db";
import { inventoryItems, clients, purchaseItems, purchases } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getSalesData() {
    try {
      const sales = await db
        .select({
          purchase: purchases,
          client: clients,
          items: sql`
            json_agg(json_build_object(
              'inventoryItem', ${inventoryItems},
              'quantity', ${purchaseItems.quantity},
              'unitPrice', ${purchaseItems.unitPrice}
            ))
          `,
        })
        .from(purchases)
        .leftJoin(clients, eq(purchases.clientId, clients.id))
        .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
        .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
        .groupBy(purchases.id, clients.id);
  
      return { 
        success: true, 
        data: sales.map(sale => ({
          ...sale.purchase,
          client: sale.client,
          items: sale.items,
          totalAmount: sale.purchase.totalAmount
        }))
      };
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return { success: false, error: "Failed to fetch sales data" };
    }
  }