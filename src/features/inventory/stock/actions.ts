"use server"

import { db } from "@/db"
import {
  inventoryItems,
  inventoryTransactions,
  inventoryPurchases,
  inventoryPurchaseItems,
  inventoryPurchasePayments,
} from "@/db/schema"
import { eq, sql, like, or, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionResponse, Purchase } from "../types"
import { unstable_noStore as noStore } from "next/cache"

// Función corregida para buscar productos de inventario
export async function searchInventory(searchTerm: string): Promise<ActionResponse<any[]>> {
  try {
    noStore()

    // Crear la consulta base
    const baseQuery = db.select().from(inventoryItems)

    // Si hay un término de búsqueda, filtrar por nombre o SKU
    if (searchTerm && searchTerm.trim() !== "") {
      const searchPattern = `%${searchTerm}%`

      // Ejecutar la consulta con el filtro
      const items = await baseQuery
        .where(or(like(inventoryItems.name, searchPattern), like(inventoryItems.sku || "", searchPattern)))
        .where(eq(inventoryItems.status, "ACTIVE"))

      return { success: true, data: items }
    } else {
      // Ejecutar la consulta sin filtro
      const items = await baseQuery.where(eq(inventoryItems.status, "ACTIVE"))

      return { success: true, data: items }
    }
  } catch (error) {
    console.error("Error searching inventory:", error)
    return { success: false, error: "Error al buscar productos" }
  }
}

export async function stockIn({
  itemId,
  quantity,
  notes,
}: {
  itemId: string
  quantity: number
  notes?: string
}): Promise<ActionResponse<void>> {
  try {
    // Verificar que el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))

    if (!item) {
      return { success: false, error: "Producto no encontrado" }
    }

    // Actualizar el stock
    await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))

    // Registrar la transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity,
      transactionType: "IN",
      notes: notes || "Entrada manual de stock",
    })

    revalidatePath("/inventario")
    return { success: true }
  } catch (error) {
    console.error("Error adding stock:", error)
    return { success: false, error: "Error al agregar stock" }
  }
}

export async function stockOut({
  itemId,
  quantity,
  notes,
}: {
  itemId: string
  quantity: number
  notes?: string
}): Promise<ActionResponse<void>> {
  try {
    // Verificar que el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))

    if (!item) {
      return { success: false, error: "Producto no encontrado" }
    }

    // Verificar que hay suficiente stock
    if (item.currentStock < quantity) {
      return {
        success: false,
        error: `Stock insuficiente. Disponible: ${item.currentStock}, Solicitado: ${quantity}`,
      }
    }

    // Actualizar el stock
    await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))

    // Registrar la transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity: -quantity, // Negativo para salidas
      transactionType: "OUT",
      notes: notes || "Salida manual de stock",
    })

    revalidatePath("/inventario")
    return { success: true }
  } catch (error) {
    console.error("Error removing stock:", error)
    return { success: false, error: "Error al retirar stock" }
  }
}

// Modificada para no usar transacciones
export async function registerPurchase(data: {
  supplierName: string
  invoiceNumber?: string
  notes?: string
  items: Array<{ itemId: string; quantity: number; unitCost: number }>
  attachments?: string[]
  isPaid?: boolean
  dueDate?: Date
}): Promise<ActionResponse<void>> {
  try {
    // Calcular el monto total de la compra
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

    // 1. Insertar la compra principal
    const [purchase] = await db
      .insert(inventoryPurchases)
      .values({
        supplierName: data.supplierName,
        invoiceNumber: data.invoiceNumber,
        totalAmount: String(totalAmount),
        notes: data.notes,
        // Si hay attachments, guardarlos como metadata
        ...(data.attachments &&
          data.attachments.length > 0 && {
            metadata: { attachments: data.attachments },
          }),
        // Agregar campos para compras a crédito
        isPaid: data.isPaid !== undefined ? data.isPaid : true,
        paidAmount: data.isPaid ? String(totalAmount) : "0",
        status: data.isPaid ? "PAID" : "PENDING",
        dueDate: data.dueDate,
      })
      .returning()

    if (!purchase) {
      throw new Error("No se pudo crear la compra")
    }

    // 2. Insertar los items de la compra
    for (const item of data.items) {
      const totalCost = item.quantity * item.unitCost

      await db.insert(inventoryPurchaseItems).values({
        purchaseId: purchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitCost: String(item.unitCost),
        totalCost: String(totalCost),
      })

      // 3. Actualizar el stock del producto
      await db
        .update(inventoryItems)
        .set({
          currentStock: sql`${inventoryItems.currentStock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, item.itemId))

      // 4. Registrar la transacción de inventario
      await db.insert(inventoryTransactions).values({
        itemId: item.itemId,
        quantity: item.quantity,
        transactionType: "IN",
        notes: `Compra #${purchase.id}`,
        reference: {
          purchaseId: purchase.id,
          unitCost: item.unitCost,
          totalCost: totalCost,
        },
      })
    }

    revalidatePath("/inventario")
    revalidatePath("/inventario/compras")
    return { success: true }
  } catch (error) {
    console.error("Error registering purchase:", error)
    return { success: false, error: "Error al registrar la compra" }
  }
}

// Modificada para no usar transacciones
export async function registerPurchasePayment(
  purchaseId: string,
  amount: number,
  paymentMethod: string,
  reference?: string,
  notes?: string,
): Promise<ActionResponse<void>> {
  try {
    // Get the purchase
    const [purchase] = await db.select().from(inventoryPurchases).where(eq(inventoryPurchases.id, purchaseId))

    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Calculate new paid amount
    const currentPaidAmount = Number(purchase.paidAmount || 0)
    const newPaidAmount = currentPaidAmount + amount
    const totalAmount = Number(purchase.totalAmount)

    // Determine new status
    let newStatus = "PENDING"
    if (newPaidAmount >= totalAmount) {
      newStatus = "PAID"
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL"
    }

    // Update the purchase
    await db
      .update(inventoryPurchases)
      .set({
        paidAmount: String(newPaidAmount),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(inventoryPurchases.id, purchaseId))

    // Insert the payment record
    await db.insert(inventoryPurchasePayments).values({
      purchaseId,
      amount: String(amount),
      paymentMethod,
      paymentDate: new Date(),
      reference,
      notes,
    })

    revalidatePath("/inventario/compras")
    return { success: true }
  } catch (error) {
    console.error("Error registering payment:", error)
    return { success: false, error: "Error al registrar el pago" }
  }
}

// Función para obtener todas las compras
export async function getPurchases(): Promise<ActionResponse<Purchase[]>> {
  try {
    noStore()

    const purchases = await db.select().from(inventoryPurchases).orderBy(desc(inventoryPurchases.purchaseDate))

    return { success: true, data: purchases }
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return { success: false, error: "Error al obtener las compras" }
  }
}

// Función para obtener compras pendientes
export async function getPendingPurchases(): Promise<ActionResponse<Purchase[]>> {
  try {
    noStore()

    const purchases = await db
      .select()
      .from(inventoryPurchases)
      .where(or(eq(inventoryPurchases.status, "PENDING"), eq(inventoryPurchases.status, "PARTIAL")))
      .orderBy(desc(inventoryPurchases.purchaseDate))

    return { success: true, data: purchases }
  } catch (error) {
    console.error("Error fetching pending purchases:", error)
    return { success: false, error: "Error al obtener las compras pendientes" }
  }
}

// Función para obtener detalles de una compra
export async function getPurchaseDetails(purchaseId: string): Promise<ActionResponse<any>> {
  try {
    noStore()

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

    // Obtener los pagos de la compra
    const payments = await db
      .select()
      .from(inventoryPurchasePayments)
      .where(eq(inventoryPurchasePayments.purchaseId, purchaseId))
      .orderBy(desc(inventoryPurchasePayments.paymentDate))

    return {
      success: true,
      data: {
        purchase,
        items: purchaseItems,
        payments,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase details:", error)
    return { success: false, error: "Error al obtener los detalles de la compra" }
  }
}

