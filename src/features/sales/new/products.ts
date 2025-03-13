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

/**
 * Create a new sale/purchase
 */
export async function createSale(data: {
  organizationId: string;
  clientId: string;
  beneficiaryId: string;
  bundleId?: string;
  notes?: string;
  saleType: "DIRECT" | "PRESALE";
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "OTHER";
  transactionReference?: string;
  cart: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    overridePrice?: number;
    stock?: number;
    allowPreSale?: boolean;
  }>;
  total: number;
}) {
  try {
    console.log("Creating sale with data:", data);

    // Calculate total amount from cart items
    const totalAmount = data.total || data.cart.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity), 
      0
    );

    // Create the purchase record
    const [purchaseResult] = await db.insert(purchases).values({
      clientId: data.clientId,
      beneficiarioId: data.beneficiaryId,
      bundleId: data.bundleId,
      organizationId: data.organizationId === "" ? null : data.organizationId,
      status: data.saleType === "PRESALE" ? "PENDING" : "COMPLETED",
      totalAmount: totalAmount.toString(),
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference,
      paymentStatus: "PAID", // Assuming direct payment for now
      isPaid: true, // Assuming direct payment for now
    }).returning();

    if (!purchaseResult) {
      throw new Error("Failed to create purchase record");
    }

    // Create purchase items for each cart item
    const purchaseItemsData = data.cart.map(item => ({
      purchaseId: purchaseResult.id,
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.unitPrice * item.quantity).toString(),
      metadata: item.overridePrice ? { overridePrice: item.overridePrice } : null,
    }));

    await db.insert(purchaseItems).values(purchaseItemsData);

    // Update inventory stock for each item
    for (const item of data.cart) {
      if (data.saleType === "DIRECT") {
        await db.update(inventoryItems)
          .set({
            currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}`,
          })
          .where(eq(inventoryItems.id, item.itemId));
      } else if (data.saleType === "PRESALE") {
        await db.update(inventoryItems)
          .set({
            reservedStock: sql`${inventoryItems.reservedStock} + ${item.quantity}`,
          })
          .where(eq(inventoryItems.id, item.itemId));
      }
    }

    // If this is a bundle sale, update the bundle's sales statistics
    if (data.bundleId) {
      await db.update(bundles)
        .set({
          totalSales: sql`${bundles.totalSales} + 1`,
          lastSaleDate: new Date(),
          totalRevenue: sql`${bundles.totalRevenue} + ${totalAmount}`,
        })
        .where(eq(bundles.id, data.bundleId));
    }

    // Revalidate the sales page to show the new sale
    revalidatePath('/sales');

    return {
      success: true,
      data: {
        ...purchaseResult,
        items: data.cart,
      }
    };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create sale" 
    };
  }
}