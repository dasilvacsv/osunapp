"use server"
import { db } from "@/db"
import {
  purchases,
  purchaseItems,
  inventoryItems,
  inventoryTransactions,
  clients,
  bundles,
  bundleItems,
  bundleBeneficiaries,
  children,
} from "@/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getPurchaseDetails(id: string) {
  try {
    const result = await db
      .select({
        purchase: purchases,
        client: clients,
        items: sql`
          json_agg(json_build_object(
            'id', ${purchaseItems.id},
            'inventoryItem', ${inventoryItems},
            'quantity', ${purchaseItems.quantity},
            'unitPrice', ${purchaseItems.unitPrice},
            'totalPrice', ${purchaseItems.totalPrice}
          ))
        `,
      })
      .from(purchases)
      .where(eq(purchases.id, id))
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .groupBy(purchases.id, clients.id)

    if (result.length === 0) return { success: false, error: "Venta no encontrada" }

    return {
      success: true,
      data: {
        ...result[0].purchase,
        client: result[0].client,
        items: result[0].items,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase details:", error)
    return { success: false, error: "Error al obtener detalles de la venta" }
  }
}

export async function createPurchase(data: {
  clientId: string
  items: Array<{ itemId: string; quantity: number; overridePrice?: number }>
  paymentMethod: string
  bundleId?: string
  beneficiary?: {
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
  }
}) {
  try {
    // Validar stock y obtener precios primero
    const itemsWithStock = await Promise.all(
      data.items.map(async (item) => {
        const [inventoryItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId))

        if (!inventoryItem) throw new Error(`Producto no encontrado: ${item.itemId}`)
        if (inventoryItem.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${inventoryItem.name} (${inventoryItem.currentStock} disponibles)`)
        }

        const unitPrice = Number(item.overridePrice || inventoryItem.basePrice)
        return {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: (unitPrice * item.quantity).toString(),
        }
      }),
    )

    // Calcular total
    const totalAmount = itemsWithStock.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)

    // Crear beneficiario si es necesario
    let childId = null
    if (data.bundleId && data.beneficiary) {
      // Validar que todos los campos del beneficiario estén completos
      const requiredFields = ["firstName", "lastName", "school", "level", "section"]
      const missingFields = requiredFields.filter(
        (field) => !data.beneficiary?.[field as keyof typeof data.beneficiary],
      )

      if (missingFields.length > 0) {
        throw new Error(`Faltan campos obligatorios del beneficiario: ${missingFields.join(", ")}`)
      }

      // Obtener el cliente para el beneficiario
      const [client] = await db.select().from(clients).where(eq(clients.id, data.clientId))
      if (!client) {
        throw new Error("Cliente no encontrado")
      }

      // Crear un registro en la tabla children primero
      const [child] = await db
        .insert(children)
        .values({
          name: `${data.beneficiary.firstName} ${data.beneficiary.lastName}`,
          clientId: data.clientId,
          organizationId: client.organizationId, // Usar organizationId del cliente
          grade: data.beneficiary.level,
          section: data.beneficiary.section,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      if (!child) {
        throw new Error("No se pudo crear el beneficiario")
      }

      childId = child.id

      // Crear el registro en bundleBeneficiaries
      await db.insert(bundleBeneficiaries).values({
        bundleId: data.bundleId,
        firstName: data.beneficiary.firstName,
        lastName: data.beneficiary.lastName,
        school: data.beneficiary.school,
        level: data.beneficiary.level,
        section: data.beneficiary.section,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Crear la compra
    const [purchase] = await db
      .insert(purchases)
      .values({
        clientId: data.clientId,
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        status: "COMPLETED",
        purchaseDate: new Date(),
        bundleId: data.bundleId,
        childId: childId,
      })
      .returning()

    // Crear items de compra
    await db.insert(purchaseItems).values(
      itemsWithStock.map((item) => ({
        purchaseId: purchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    )

    // Actualizar inventario
    for (const item of data.items) {
      await db
        .update(inventoryItems)
        .set({ currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}` })
        .where(eq(inventoryItems.id, item.itemId))

      await db.insert(inventoryTransactions).values({
        itemId: item.itemId,
        quantity: -item.quantity,
        transactionType: "SALE",
        notes: `Venta #${purchase.id}`,
        createdAt: new Date(),
      })
    }

    // Revalidar rutas
    revalidatePath("/sales")
    revalidatePath(`/sales/${purchase.id}`)

    return { success: true, data: purchase }
  } catch (error) {
    console.error("Error creating purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar la venta",
    }
  }
}

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
      .groupBy(purchases.id, clients.id)

    return {
      success: true,
      data: sales.map((sale) => ({
        ...sale.purchase,
        client: sale.client,
        items: sale.items,
        totalAmount: sale.purchase.totalAmount,
      })),
    }
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return { success: false, error: "Failed to fetch sales data" }
  }
}

export async function updatePurchaseStatus(id: string, newStatus: string) {
  try {
    // Validar el nuevo estado
    const validStatuses = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const
    if (!validStatuses.includes(newStatus as (typeof validStatuses)[number])) {
      return { success: false, error: "Estado inválido" }
    }

    // Asegurar que el tipo sea compatible con el enum de Drizzle
    const status = newStatus as (typeof validStatuses)[number]

    const [updatedPurchase] = await db
      .update(purchases)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    // Revalidar rutas relevantes
    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedPurchase,
    }
  } catch (error) {
    console.error("Error updating status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el estado",
    }
  }
}

export async function searchBundles(query: string) {
  try {
    const data = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
        items: sql`json_agg(json_build_object(
        'id', ${bundleItems.id},
        'quantity', ${bundleItems.quantity},
        'overridePrice', ${bundleItems.overridePrice},
        'item', json_build_object(
          'id', ${inventoryItems.id},
          'name', ${inventoryItems.name},
          'currentStock', ${inventoryItems.currentStock},
          'basePrice', ${inventoryItems.basePrice}
        )
      ))`,
      })
      .from(bundles)
      .leftJoin(bundleItems, eq(bundles.id, bundleItems.bundleId))
      .leftJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
      .where(and(eq(bundles.status, "ACTIVE"), sql`LOWER(${bundles.name}) LIKE ${"%" + query.toLowerCase() + "%"}`))
      .groupBy(bundles.id)
      .limit(10)

    return { success: true, data }
  } catch (error) {
    console.error("Error searching bundles:", error)
    return { success: false, error: "Error buscando paquetes" }
  }
}

