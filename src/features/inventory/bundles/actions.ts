"use server"

import { db } from "@/db"
import {
  bundleCategories,
  bundles,
  bundleItems,
  inventoryItems,
  organizations,
  inventoryTransactions,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"
import type { ActionResponse, CreateBundleInput, BundleWithItems } from "../types"

// Obtener todas las categorías de paquetes
export async function getBundleCategories(): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    noStore()
    const categories = await db
      .select({
        id: bundleCategories.id,
        name: bundleCategories.name,
      })
      .from(bundleCategories)
      .where(eq(bundleCategories.status, "ACTIVE"))
      .orderBy(bundleCategories.name)

    return { success: true, data: categories }
  } catch (error) {
    console.error("Error fetching bundle categories:", error)
    return { success: false, error: "Error al obtener las categorías de paquetes" }
  }
}

export async function createBundleCategory(input: { name: string }): Promise<
  ActionResponse<{ id: string; name: string }>
> {
  try {
    const [category] = await db
      .insert(bundleCategories)
      .values({
        name: input.name,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: bundleCategories.id,
        name: bundleCategories.name,
      })

    if (!category) {
      return { success: false, error: "No se pudo crear la categoría" }
    }

    revalidatePath("/inventario/bundles")
    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating bundle category:", error)
    return { success: false, error: "Error al crear la categoría" }
  }
}

// Crear un nuevo paquete - Modificado para usar precio base directo
export async function createBundle(input: CreateBundleInput): Promise<ActionResponse<string>> {
  try {
    // Verificamos si el campo notes existe en el esquema
    // Si no existe, lo omitimos en la inserción
    const bundleData: any = {
      name: input.name,
      description: input.description || null,
      categoryId: input.categoryId,
      type: "REGULAR",
      basePrice: input.basePrice.toString(),
      bundlePrice: input.salePrice.toString(),
      discountPercentage: input.margin.toString(),
      currencyType: input.currencyType || "USD",
      conversionRate: input.conversionRate ? input.conversionRate.toString() : null,
      organizationId: input.organizationId || null,
    }

    // Solo agregamos notes si existe en el esquema
    if (input.notes) {
      try {
        // Intentamos agregar notes al objeto
        bundleData.notes = input.notes
      } catch (e) {
        console.warn("El campo 'notes' no existe en el esquema de bundles, se omitirá")
      }
    }

    const [bundle] = await db.insert(bundles).values(bundleData).returning({ id: bundles.id })

    if (!bundle) throw new Error("No se pudo crear el paquete")

    for (const item of input.items) {
      await db.insert(bundleItems).values({
        bundleId: bundle.id,
        itemId: item.itemId,
        quantity: item.quantity,
        overridePrice: null, // Ya no usamos override price por ítem
      })
    }

    revalidatePath("/inventario/bundles")
    return { success: true, data: bundle.id }
  } catch (error) {
    console.error("Error creating bundle:", error)
    return { success: false, error: "Error al crear el paquete" }
  }
}

// Crear transacción de inventario para descontar ítems
export async function createInventoryTransaction(input: {
  itemId: string
  quantity: number
  transactionType: "INITIAL" | "IN" | "OUT" | "ADJUSTMENT" | "RESERVATION" | "FULFILLMENT"
  reference: Record<string, any>
  notes: string
}): Promise<ActionResponse<string>> {
  try {
    const [transaction] = await db
      .insert(inventoryTransactions)
      .values({
        itemId: input.itemId,
        quantity: input.quantity,
        transactionType: input.transactionType,
        reference: input.reference,
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: inventoryTransactions.id })

    if (!transaction) throw new Error("No se pudo crear la transacción")

    // Actualizar el stock del ítem
    // Usamos una consulta directa para actualizar el stock
    await db
      .update(inventoryItems)
      .set({
        currentStock: db.sql`${inventoryItems.currentStock} + ${input.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, input.itemId))

    return { success: true, data: transaction.id }
  } catch (error) {
    console.error("Error creating inventory transaction:", error)
    return { success: false, error: "Error al crear la transacción de inventario" }
  }
}

export async function getOrganizations(): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    noStore()
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.status, "ACTIVE"))
      .orderBy(organizations.name)

    return { success: true, data: orgs }
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return { success: false, error: "Error al obtener las organizaciones" }
  }
}

// Obtener todos los paquetes con sus items
export async function getBundles(): Promise<ActionResponse<BundleWithItems[]>> {
  try {
    noStore()
    const bundlesList = await db
      .select({
        bundle: bundles,
        organization: {
          id: organizations.id,
          name: organizations.name,
        },
      })
      .from(bundles)
      .leftJoin(organizations, eq(bundles.organizationId, organizations.id))
      .where(eq(bundles.status, "ACTIVE"))
      .orderBy(bundles.createdAt)

    const bundlesWithItems = await Promise.all(
      bundlesList.map(async ({ bundle, organization }) => {
        const bundleItemsWithDetails = await db
          .select({
            bundleItem: bundleItems,
            item: inventoryItems,
          })
          .from(bundleItems)
          .where(eq(bundleItems.bundleId, bundle.id))
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))

        const basePrice = Number(bundle.basePrice)
        const margin = Number(bundle.discountPercentage || 0)
        const salePrice = Number(bundle.bundlePrice || 0)

        // Cálculo correcto del costo estimado
        let totalEstimatedCost = 0
        bundleItemsWithDetails.forEach((i) => {
          // Si costPrice no existe, intentamos calcularlo a partir del basePrice y margin
          let itemCost = 0
          if (i.item.costPrice) {
            itemCost = Number(i.item.costPrice)
          } else if (i.item.basePrice && i.item.margin) {
            // Si no hay costPrice pero tenemos basePrice y margin, calculamos el costo
            const itemBasePrice = Number(i.item.basePrice)
            const itemMargin = Number(i.item.margin)
            itemCost = itemBasePrice / (1 + itemMargin)
          }

          totalEstimatedCost += itemCost * i.bundleItem.quantity
        })

        const profit = salePrice - totalEstimatedCost
        const profitPercentage = salePrice > 0 ? (profit / salePrice) * 100 : 0

        // Convertimos el resultado a BundleWithItems
        const bundleWithItems: BundleWithItems = {
          ...bundle,
          organization,
          items: bundleItemsWithDetails.map((i) => ({
            itemId: i.item.id,
            item: i.item,
            quantity: i.bundleItem.quantity,
            // Calculamos el costo para cada ítem
            costPrice: i.item.costPrice
              ? Number(i.item.costPrice)
              : i.item.basePrice && i.item.margin
                ? Number(i.item.basePrice) / (1 + Number(i.item.margin))
                : 0,
          })),
          totalBasePrice: basePrice,
          totalDiscountedPrice: salePrice,
          savings: 0, // Ya no calculamos ahorros
          savingsPercentage: 0, // Ya no calculamos porcentaje de ahorro
          totalEstimatedCost,
          profit,
          profitPercentage,
          currencyType: bundle.currencyType || "USD",
          conversionRate: bundle.conversionRate || "1",
        }

        return bundleWithItems
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Error al obtener los paquetes" }
  }
}

