"use server"
import { db } from "@/db"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { purchases, purchaseItems, bundleItems, bundles, inventoryItems, inventoryTransactions } from "@/db/schema"
import { unstable_noStore as noStore } from 'next/cache';

export async function getAllBundlesAndItems() {
  try {
    noStore()
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
                      'allowPresale', ${inventoryItems.allowPresale},
                      'metadata', ${inventoryItems.metadata}
                    )
                  )
                END
              ),
              '[]'::json
            )`,
      })
      .from(bundles)
      .leftJoin(bundleItems, eq(bundles.id, bundleItems.bundleId))
      .leftJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
      .where(eq(bundles.status, "ACTIVE"))
      .groupBy(bundles.id)

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
        allowPresale: inventoryItems.allowPresale,
        metadata: inventoryItems.metadata,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.status, "ACTIVE"))

    return {
      success: true,
      data: {
        bundles: bundlesResult.map((bundle) => ({
          ...bundle,
          items: bundle.items || [],
        })),
        items: itemsResult,
      },
    }
  } catch (error) {
    console.error("Error al obtener paquetes e ítems:", error)
    return { success: false, error: "Error al obtener paquetes e ítems" }
  }
}

/**
 * Create a new sale/purchase
 */
export async function createSale(data: {
  organizationId: string | null
  clientId: string
  beneficiaryId: string
  bundleId?: string
  notes?: string
  saleType: "DIRECT" | "PRESALE"
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "OTHER"
  transactionReference?: string
  cart: Array<{
    itemId: string
    name: string
    quantity: number
    unitPrice: number
    overridePrice?: number
    stock?: number
    allowPreSale?: boolean
  }>
  total: number
}) {
  try {
    console.log("Creando venta con datos:", data)

    // Validate required fields
    if (!data.clientId) {
      throw new Error("El ID del cliente es requerido")
    }

    if (!data.beneficiaryId) {
      throw new Error("El ID del beneficiario es requerido")
    }

    if (!data.cart.length) {
      throw new Error("El carrito no puede estar vacío")
    }

    // Check stock availability and automatically switch to PRESALE if needed
    let shouldBePresale = data.saleType === "PRESALE"
    if (data.saleType === "DIRECT") {
      for (const item of data.cart) {
        // Get current stock
        const [inventoryItem] = await db
          .select({ currentStock: inventoryItems.currentStock })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, item.itemId))

        if (!inventoryItem || inventoryItem.currentStock < item.quantity) {
          shouldBePresale = true
          break
        }
      }
    }

    // Calculate total amount from cart items
    const totalAmount = data.total || data.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    // Create the purchase record without using transactions
    const [purchaseResult] = await db
      .insert(purchases)
      .values({
        clientId: data.clientId,
        beneficiarioId: data.beneficiaryId,
        bundleId: data.bundleId || null,
        organizationId: data.organizationId || null,
        status: shouldBePresale ? "PENDING" : "COMPLETED",
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference || null,
        paymentStatus: "PAID",
        isPaid: true,
        paymentMetadata: { 
          saleType: shouldBePresale ? "PRESALE" : "DIRECT",
          originalSaleType: data.saleType,
          automaticPresale: shouldBePresale && data.saleType === "DIRECT"
        },
      })
      .returning()

    if (!purchaseResult) {
      throw new Error("Error al crear el registro de compra")
    }

    // Create purchase items for each cart item
    const purchaseItemsData = data.cart.map((item) => ({
      purchaseId: purchaseResult.id,
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.unitPrice * item.quantity).toString(),
      metadata: {
        ...(item.overridePrice ? { overridePrice: item.overridePrice } : {}),
        originalStock: item.stock,
      },
    }))

    await db.insert(purchaseItems).values(purchaseItemsData)

    // Update inventory stock for each item
    for (const item of data.cart) {
      if (!shouldBePresale) {
        // For direct sales, decrease inventory immediately
        await db
          .update(inventoryItems)
          .set({
            currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, item.itemId))

        // Record transaction
        await db.insert(inventoryTransactions).values({
          itemId: item.itemId,
          quantity: -item.quantity,
          transactionType: "OUT",
          reference: { purchaseId: purchaseResult.id },
          notes: `Venta #${purchaseResult.id}`,
        })
      } else {
        // For pre-sales, update reserved stock
        await db
          .update(inventoryItems)
          .set({
            reservedStock: sql`COALESCE(${inventoryItems.reservedStock}, 0) + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, item.itemId))

        // Record reservation transaction
        await db.insert(inventoryTransactions).values({
          itemId: item.itemId,
          quantity: -item.quantity,
          transactionType: "RESERVATION",
          reference: { purchaseId: purchaseResult.id },
          notes: `Pre-venta #${purchaseResult.id}`,
        })
      }
    }

    // If this is a bundle sale, update the bundle's statistics
    if (data.bundleId) {
      await db
        .update(bundles)
        .set({
          totalSales: sql`COALESCE(${bundles.totalSales}, 0) + 1`,
          lastSaleDate: new Date(),
          totalRevenue: sql`COALESCE(${bundles.totalRevenue}, 0) + ${totalAmount}`,
        })
        .where(eq(bundles.id, data.bundleId))
    }

    // Revalidate the sales and inventory pages
    revalidatePath("/sales")
    revalidatePath("/inventory")

    return {
      success: true,
      data: {
        ...purchaseResult,
        items: data.cart,
        automaticPresale: shouldBePresale && data.saleType === "DIRECT"
      },
    }
  } catch (error) {
    console.error("Error al crear venta:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear venta",
    }
  }
}