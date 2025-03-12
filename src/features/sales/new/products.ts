// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { and, eq, sql, inArray, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  purchaseItems,
  organizationMembers,
  bundleItems,
  bundles,
  inventoryItems
} from "@/db/schema";

export async function getAllBundlesAndItems() {
    try {
      // Get all bundles with their items
      const bundlesResult = await db
        .select({
          id: bundles.id,
          name: bundles.name,
          description: bundles.description,
          type: bundles.type,
          basePrice: bundles.basePrice,
          status: bundles.status,
          items: sql`
            COALESCE(
              json_agg(
                CASE WHEN ${bundleItems.id} IS NOT NULL THEN
                  json_build_object(
                    'id', ${bundleItems.id},
                    'quantity', ${bundleItems.quantity},
                    'overridePrice', ${bundleItems.overridePrice},
                    'item', json_build_object(
                      'id', ${inventoryItems.id},
                      'name', ${inventoryItems.name},
                      'currentStock', ${inventoryItems.currentStock},
                      'basePrice', ${inventoryItems.basePrice},
                      'status', ${inventoryItems.status},
                      'sku', ${inventoryItems.sku},
                      'metadata', ${inventoryItems.metadata}
                    )
                  )
                END
              ),
              '[]'::json
            )`
        })
        .from(bundles)
        .leftJoin(bundleItems, eq(bundles.id, bundleItems.bundleId))
        .leftJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
        .where(eq(bundles.status, "ACTIVE"))
        .groupBy(bundles.id);
  
      // Get all inventory items
      const itemsResult = await db
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          currentStock: inventoryItems.currentStock,
          basePrice: inventoryItems.basePrice,
          status: inventoryItems.status,
          metadata: inventoryItems.metadata
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.status, "ACTIVE"));
  
      // Log the raw data to see what we're getting
      console.log("Raw bundles result:", bundlesResult);
  
      return { 
        success: true, 
        data: {
          bundles: bundlesResult.map(bundle => ({
            ...bundle,
            items: bundle.items || []
          })),
          items: itemsResult
        }
      };
    } catch (error) {
      console.error("Error fetching bundles and items:", error);
      return { success: false, error: "Failed to fetch bundles and items" };
    }
  }