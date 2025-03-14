"use server"

import { db } from "@/db"
import {
  inventoryItems,
  inventoryTransactions,
  inventoryPurchases,
  inventoryPurchaseItems,
} from "@/db/schema"
import { eq, desc, sql, and, gte, or, gt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type {
  StockTransactionInput,
} from "../old/types"
import { purchaseSchema } from "../old/validation"

export async function searchInventory(query: string) {
  try {
    const data = await db
      .select()
      .from(inventoryItems)
      .where(sql`LOWER(${inventoryItems.name}) LIKE ${"%" + query.toLowerCase() + "%"}`)
      .limit(10)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Error buscando productos" }
  }
}

export async function stockIn({
  itemId,
  quantity,
  notes,
  reference,
  transactionType = "IN",
}: StockTransactionInput & { transactionType?: "IN" | "INITIAL" }) {
  try {
    if (!itemId || quantity <= 0) {
      throw new Error("Datos inválidos: itemId y cantidad deben ser proporcionados y válidos.")
    }

    // Verificar si el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
    if (!item) {
      throw new Error("Item no encontrado.")
    }

    // Actualizar stock
    await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))

    // Registrar transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity,
      transactionType,
      notes,
      reference,
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error en stock-in:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al realizar stock-in.",
    }
  }
}

export async function stockOut({ itemId, quantity, notes, reference }: StockTransactionInput) {
  try {
    if (!itemId || quantity <= 0) {
      throw new Error("Datos inválidos: itemId y cantidad deben ser proporcionados y válidos.")
    }

    // Verificar si el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
    if (!item) {
      throw new Error("Item no encontrado.")
    }

    // Verificar si hay suficiente stock
    if (item.currentStock < quantity) {
      throw new Error("Stock insuficiente.")
    }

    // Actualizar stock
    await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))

    // Registrar transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity: -quantity,
      transactionType: "OUT",
      notes,
      reference,
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error en stock-out:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al realizar stock-out.",
    }
  }
}

// New function to register a purchase and update inventory items
export async function registerPurchase(input: any) {
  try {
    const validated = purchaseSchema.parse(input)

    // Create purchase record
    const [purchase] = await db
      .insert(inventoryPurchases)
      .values({
        supplierName: validated.supplierName,
        invoiceNumber: validated.invoiceNumber,
        notes: validated.notes,
        totalAmount: validated.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0),
        purchaseDate: new Date(),
      })
      .returning()

    // Create purchase items and update inventory
    for (const item of validated.items) {
      // Register purchase item
      await db.insert(inventoryPurchaseItems).values({
        purchaseId: purchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      })

      // Get current item data for cost averaging
      const [currentItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId))

      if (!currentItem) {
        throw new Error(`Item con ID ${item.itemId} no encontrado.`)
      }

      // Calculate new average cost and update base price
      const currentTotalValue = currentItem.currentStock * currentItem.basePrice
      const newItemsValue = item.quantity * item.unitCost
      const newTotalQuantity = currentItem.currentStock + item.quantity
      const newAverageCost = (currentTotalValue + newItemsValue) / newTotalQuantity

      // Update inventory item with new stock and price
      await db
        .update(inventoryItems)
        .set({
          currentStock: sql`${inventoryItems.currentStock} + ${item.quantity}`,
          basePrice: newAverageCost, // Update with new average cost
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, item.itemId))

      // Create transaction record
      await db.insert(inventoryTransactions).values({
        itemId: item.itemId,
        quantity: item.quantity,
        transactionType: "IN",
        notes: `Compra #${purchase.id} - ${validated.supplierName}`,
        reference: {
          purchaseId: purchase.id,
          unitCost: item.unitCost,
          previousCost: currentItem.basePrice,
          newCost: newAverageCost,
        },
      })
    }

    revalidatePath("/inventory")
    return { success: true, data: purchase }
  } catch (error) {
    console.error("Error registering purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar la compra.",
    }
  }
}
