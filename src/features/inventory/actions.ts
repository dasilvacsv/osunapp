"use server"

import { db } from "@/db"
import { inventoryItems, inventoryTransactions, inventoryPurchases, inventoryPurchaseItems } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import type { ActionResponse, InventoryItem, InventoryTransaction } from "./types"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"

export async function getInventoryItems(): Promise<ActionResponse<InventoryItem[]>> {
  try {
    noStore()

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
    const preSaleCountMap = new Map(preSaleCounts.map(({ itemId, count }) => [itemId, Number(count)]))

    // Merge the data
    const enrichedItems = items.map((item) => ({
      ...item,
      preSaleCount: preSaleCountMap.get(item.id) || 0,
    }))

    return { success: true, data: enrichedItems }
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return { success: false, error: "Error al obtener los productos del inventario" }
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
    return { success: false, error: "Error al obtener el historial de transacciones" }
  }
}

export async function getInventoryItem(id: string): Promise<ActionResponse<InventoryItem>> {
  try {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id))
    if (!item) {
      return { success: false, error: "Producto no encontrado" }
    }
    return { success: true, data: item }
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return { success: false, error: "Error al obtener el producto" }
  }
}

export async function updateInventoryItemStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<ActionResponse<void>> {
  try {
    await db.update(inventoryItems).set({ status, updatedAt: new Date() }).where(eq(inventoryItems.id, id))
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating item status:", error)
    return { success: false, error: "Error al actualizar el estado del producto" }
  }
}

// Mejorar la función updatePreSaleFlag para asegurar que solo actualiza el elemento específico
export async function updatePreSaleFlag(id: string, allowPresale: boolean): Promise<ActionResponse<void>> {
  try {
    // Verificar que el item existe antes de actualizarlo
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id))

    if (!item) {
      return { success: false, error: "Producto no encontrado" }
    }

    // Actualizar el campo allowPresale directamente
    const result = await db
      .update(inventoryItems)
      .set({
        allowPresale,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning()

    // Verificar que la actualización fue exitosa
    if (!result || result.length === 0) {
      return { success: false, error: "No se pudo actualizar el estado de pre-venta" }
    }

    // Revalidar la ruta para asegurar que los cambios se reflejen en la UI
    revalidatePath("/inventory")

    return { success: true }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Error al actualizar la configuración de pre-venta" }
  }
}

// Function to update inventory when a sale is made
export async function decreaseInventoryForSale(
  items: Array<{ itemId: string; quantity: number }>,
  saleId: string,
): Promise<ActionResponse<void>> {
  try {
    // Process each item in the sale
    for (const { itemId, quantity } of items) {
      // Get the current item to check stock and pre-sale status
      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))

      if (!item) {
        return { success: false, error: `Producto con ID ${itemId} no encontrado` }
      }

      // Check if we have enough stock or if pre-sale is allowed
      if (item.currentStock < quantity && !item.allowPresale) {
        return {
          success: false,
          error: `Stock insuficiente para el producto ${item.name}. Disponible: ${item.currentStock}, Solicitado: ${quantity}`,
        }
      }

      // If it's a pre-sale and we don't have enough stock
      if (item.currentStock < quantity && item.allowPresale) {
        // Calculate how many units are pre-sale
        const regularUnits = item.currentStock
        const preSaleUnits = quantity - regularUnits

        // Decrease available stock to zero
        await db
          .update(inventoryItems)
          .set({
            currentStock: 0,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, itemId))

        // Record regular stock transaction if any
        if (regularUnits > 0) {
          await db.insert(inventoryTransactions).values({
            itemId,
            quantity: -regularUnits,
            transactionType: "OUT",
            notes: `Venta #${saleId}`,
            reference: { saleId },
          })
        }

        // Record pre-sale transaction
        await db.insert(inventoryTransactions).values({
          itemId,
          quantity: -preSaleUnits,
          transactionType: "RESERVATION",
          notes: `Pre-venta #${saleId}`,
          reference: { saleId, isPreSale: true },
        })
      } else {
        // Regular sale with sufficient stock
        await db
          .update(inventoryItems)
          .set({
            currentStock: sql`${inventoryItems.currentStock} - ${quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, itemId))

        // Record transaction
        await db.insert(inventoryTransactions).values({
          itemId,
          quantity: -quantity,
          transactionType: "OUT",
          notes: `Venta #${saleId}`,
          reference: { saleId },
        })
      }
    }

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating inventory for sale:", error)
    return { success: false, error: "Error al actualizar el inventario para la venta" }
  }
}

export type CreateInventoryItemInput = {
  name: string
  sku: string
  type: string
  basePrice: number
  currentStock: number
  reservedStock?: number
  minimumStock?: number
  status?: string
  description?: string
  initialInventoryCost?: number
}

export async function createInventoryItem(input: CreateInventoryItemInput) {
  try {
    // Crear el item de inventario
    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...input,
        basePrice: String(input.basePrice),
        status: input.status || "ACTIVE",
      })
      .returning()

    // Crear transacción de inventario inicial si el stock es mayor a 0
    if (input.currentStock > 0) {
      await db.insert(inventoryTransactions).values({
        itemId: item.id,
        quantity: input.currentStock,
        transactionType: "INITIAL",
        notes: "Initial inventory stock",
        createdAt: new Date(),
        // Add reference with cost information if provided
        reference: input.initialInventoryCost
          ? {
              initialCost: input.initialInventoryCost,
              totalCost: input.initialInventoryCost * input.currentStock,
            }
          : undefined,
      })
    }

    revalidatePath("/inventory")
    return { success: true, data: item }
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return { success: false, error: "Error al crear el artículo de inventario" }
  }
}

// Función simplificada para obtener compras de inventario
export async function getInventoryPurchases(): Promise<ActionResponse<any[]>> {
  try {
    noStore()

    const purchases = await db.select().from(inventoryPurchases).orderBy(desc(inventoryPurchases.purchaseDate))

    return { success: true, data: purchases }
  } catch (error) {
    console.error("Error fetching inventory purchases:", error)
    return { success: false, error: "Error al obtener las compras de inventario" }
  }
}

export async function getPurchaseDetails(purchaseId: string): Promise<ActionResponse<any>> {
  try {
    // Obtener la compra
    const [purchase] = await db.select().from(inventoryPurchases).where(eq(inventoryPurchases.id, purchaseId))

    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Obtener los items de la compra
    const purchaseItems = await db
      .select({
        purchaseItem: inventoryPurchaseItems,
        item: inventoryItems,
      })
      .from(inventoryPurchaseItems)
      .leftJoin(inventoryItems, eq(inventoryPurchaseItems.itemId, inventoryItems.id))
      .where(eq(inventoryPurchaseItems.purchaseId, purchaseId))

    return {
      success: true,
      data: {
        purchase,
        items: purchaseItems,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase details:", error)
    return { success: false, error: "Error al obtener los detalles de la compra" }
  }
}

