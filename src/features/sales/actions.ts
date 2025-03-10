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
  organizations,
} from "@/db/schema"
import { and, eq, sql, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getPurchaseDetails(id: string) {
  try {
    const result = await db
      .select({
        purchase: purchases,
        client: clients,
        organization: organizations,
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
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .groupBy(purchases.id, clients.id, organizations.id)

    if (result.length === 0) return { success: false, error: "Venta no encontrada" }

    return {
      success: true,
      data: {
        ...result[0].purchase,
        client: result[0].client,
        organization: result[0].organization,
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
  saleType?: "DIRECT" | "PRESALE"
  organizationId?: string | null
}) {
  try {
    // Validar stock y obtener precios primero
    const itemsWithStock = await Promise.all(
      data.items.map(async (item) => {
        const [inventoryItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId))

        if (!inventoryItem) throw new Error(`Producto no encontrado: ${item.itemId}`)

        // Solo validar stock para ventas directas y si no está habilitada la pre-venta
        if (data.saleType !== "PRESALE" && inventoryItem.currentStock < item.quantity && !inventoryItem.allowPreSale) {
          throw new Error(`Stock insuficiente para ${inventoryItem.name} (${inventoryItem.currentStock} disponibles)`)
        }

        const unitPrice = Number(item.overridePrice || inventoryItem.basePrice)
        return {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: (unitPrice * item.quantity).toString(),
          allowPreSale: inventoryItem.allowPreSale,
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
        organizationId: data.organizationId || null,
      })
    }

    // Crear la compra
    const [purchase] = await db
      .insert(purchases)
      .values({
        clientId: data.clientId,
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        status: data.saleType === "PRESALE" ? "PENDING" : "COMPLETED",
        purchaseDate: new Date(),
        bundleId: data.bundleId,
        childId: childId,
        // saleType: data.saleType || "DIRECT",
        paymentType: "FULL", // Por defecto, se puede cambiar después
        isPaid: data.saleType !== "PRESALE", // Las ventas directas se consideran pagadas
        organizationId: data.organizationId || null,
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

    // Actualizar inventario solo para ventas directas
    if (data.saleType !== "PRESALE") {
      for (const item of data.items) {
        await db
          .update(inventoryItems)
          .set({ currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}` })
          .where(eq(inventoryItems.id, item.itemId))

        // Registrar la transacción con nota especial si es pre-venta
        const [inventoryItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId))
        const isPreSale = inventoryItem && inventoryItem.allowPreSale && inventoryItem.currentStock < item.quantity

        await db.insert(inventoryTransactions).values({
          itemId: item.itemId,
          quantity: -item.quantity,
          transactionType: "SALE",
          notes: isPreSale ? `Venta #${purchase.id} (Pre-venta)` : `Venta #${purchase.id}`,
          createdAt: new Date(),
        })
      }
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
    // Modificamos la consulta para no incluir payment_type que parece no existir en la tabla
    const sales = await db
      .select({
        id: purchases.id,
        clientId: purchases.clientId,
        bundleId: purchases.bundleId,
        status: purchases.status,
        totalAmount: purchases.totalAmount,
        paymentMethod: purchases.paymentMethod,
        purchaseDate: purchases.purchaseDate,
        transactionReference: purchases.transactionReference,
        // Eliminamos la referencia a payment_type
        // Usamos un valor por defecto para saleType si no existe
        // saleType: sql`COALESCE(${purchases.saleType}, 'DIRECT')::text`,
        // Usamos un valor por defecto para isPaid si no existe
        isPaid: sql`COALESCE(${purchases.isPaid}, false)`,
        client: clients,
        organization: organizations,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .orderBy(sql`${purchases.purchaseDate} DESC`)

    return {
      success: true,
      data: sales,
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

// Arreglar la función searchBundles para asegurar que devuelva datos correctos
export async function searchBundles(query: string) {
  try {
    // Primero obtenemos los bundles que coinciden con la búsqueda
    const bundlesResult = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
      })
      .from(bundles)
      .where(and(eq(bundles.status, "ACTIVE"), sql`LOWER(${bundles.name}) LIKE ${"%" + query.toLowerCase() + "%"}`))
      .limit(10)

    // Para cada bundle, obtenemos sus items
    const bundlesWithItems = await Promise.all(
      bundlesResult.map(async (bundle) => {
        const bundleItemsResult = await db
          .select({
            id: bundleItems.id,
            quantity: bundleItems.quantity,
            overridePrice: bundleItems.overridePrice,
            item: {
              id: inventoryItems.id,
              name: inventoryItems.name,
              currentStock: inventoryItems.currentStock,
              basePrice: inventoryItems.basePrice,
              allowPreSale: inventoryItems.allowPreSale,
            },
          })
          .from(bundleItems)
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
          .where(eq(bundleItems.bundleId, bundle.id))

        return {
          ...bundle,
          items: bundleItemsResult,
        }
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error searching bundles:", error)
    return { success: false, error: "Error buscando paquetes" }
  }
}

export async function searchInventoryItems(query: string) {
  try {
    const data = await db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.status, "ACTIVE"),
          or(
            sql`LOWER(${inventoryItems.name}) LIKE ${"%" + query.toLowerCase() + "%"}`,
            sql`LOWER(${inventoryItems.sku}) LIKE ${"%" + query.toLowerCase() + "%"}`,
          ),
        ),
      )
      .limit(10)

    return { success: true, data }
  } catch (error) {
    console.error("Error searching inventory items:", error)
    return { success: false, error: "Error buscando productos" }
  }
}

export async function searchClients(query: string) {
  try {
    const data = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        organizationId: clients.organizationId,
        organization: organizations,
      })
      .from(clients)
      .leftJoin(organizations, eq(clients.organizationId, organizations.id))
      .where(
        or(
          sql`LOWER(${clients.name}) LIKE ${"%" + query.toLowerCase() + "%"}`,
          sql`${clients.id}::text LIKE ${"%" + query.toLowerCase() + "%"}`,
        ),
      )
      .limit(10)

    return { success: true, data }
  } catch (error) {
    console.error("Error searching clients:", error)
    return { success: false, error: "Error buscando clientes" }
  }
}

export async function deleteBundle(bundleId: string) {
  try {
    // Verificar si hay ventas asociadas al paquete
    const salesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(eq(purchases.bundleId, bundleId))

    if (salesCount[0].count > 0) {
      return {
        success: false,
        error: "No se puede eliminar el paquete porque tiene ventas asociadas",
      }
    }

    // Eliminar beneficiarios asociados
    await db.delete(bundleBeneficiaries).where(eq(bundleBeneficiaries.bundleId, bundleId))

    // Eliminar items del paquete
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, bundleId))

    // Finalmente, eliminar el paquete
    const [deletedBundle] = await db.delete(bundles).where(eq(bundles.id, bundleId)).returning()

    if (!deletedBundle) {
      return { success: false, error: "Paquete no encontrado" }
    }

    // Revalidar rutas
    revalidatePath("/packages")

    return { success: true, data: deletedBundle }
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar el paquete",
    }
  }
}

// Añade estas funciones a tu archivo de actions.ts

export async function updateItemPreSaleFlag(itemId: string, allowPreSale: boolean) {
  try {
    const response = await fetch(`/api/inventory/items/${itemId}/pre-sale`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ allowPreSale }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Error al actualizar el estado de pre-venta" }
    }

    return { success: true, data: data.item }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Error de conexión al actualizar el estado de pre-venta" }
  }
}

export async function getPreSaleCount(itemId: string) {
  try {
    const response = await fetch(`/api/inventory/items/${itemId}/pre-sale-count`)
    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Error al obtener el conteo de pre-ventas" }
    }

    return { success: true, data: data.count }
  } catch (error) {
    console.error("Error fetching pre-sale count:", error)
    return { success: false, error: "Error de conexión al obtener el conteo de pre-ventas" }
  }
}

