"use server"

import { db } from "@/db"
import { bundleCategories, bundles, bundleItems, inventoryItems } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"
import type { ActionResponse, CreateBundleInput, BundleWithItems } from "../types"

// Obtener todas las categorías de bundles
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
    return { success: false, error: "Error al obtener las categorías de bundles" }
  }
}

// Crear un nuevo bundle - Modificado para no usar transacciones
export async function createBundle(input: CreateBundleInput): Promise<ActionResponse<string>> {
  try {
    // 1. Crear el bundle principal
    const [bundle] = await db
      .insert(bundles)
      .values({
        name: input.name,
        description: input.description || null,
        categoryId: input.categoryId,
        type: "REGULAR", // Puedes ajustar esto según tus necesidades
        basePrice: input.totalBasePrice,
        discountPercentage: input.savingsPercentage,
        bundlePrice: input.totalBasePrice * (1 - input.savingsPercentage / 100),
      })
      .returning({ id: bundles.id })

    if (!bundle) {
      throw new Error("No se pudo crear el bundle")
    }

    // 2. Crear los items del bundle
    for (const item of input.items) {
      await db.insert(bundleItems).values({
        bundleId: bundle.id,
        itemId: item.itemId,
        quantity: item.quantity,
        overridePrice: item.overridePrice,
      })
    }

    // Revalidar la ruta para actualizar la UI
    revalidatePath("/inventario/bundles")

    return { success: true, data: bundle.id }
  } catch (error) {
    console.error("Error creating bundle:", error)
    return { success: false, error: "Error al crear el bundle" }
  }
}

// Obtener todos los bundles con sus items
export async function getBundles(): Promise<ActionResponse<BundleWithItems[]>> {
  try {
    noStore()

    // 1. Obtener todos los bundles
    const bundlesList = await db.select().from(bundles).where(eq(bundles.status, "ACTIVE")).orderBy(bundles.createdAt)

    // 2. Para cada bundle, obtener sus items
    const bundlesWithItems = await Promise.all(
      bundlesList.map(async (bundle) => {
        const bundleItemsWithDetails = await db
          .select({
            bundleItem: bundleItems,
            item: inventoryItems,
          })
          .from(bundleItems)
          .where(eq(bundleItems.bundleId, bundle.id))
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))

        // Calcular totales
        const totalBasePrice = Number(bundle.basePrice)
        const discountPercentage = Number(bundle.discountPercentage || 0)
        const totalDiscountedPrice = totalBasePrice * (1 - discountPercentage / 100)
        const savings = totalBasePrice - totalDiscountedPrice
        const savingsPercentage = totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0

        // Calcular el costo total estimado (usando el precio base y el margen)
        let totalEstimatedCost = 0
        bundleItemsWithDetails.forEach((i) => {
          const basePrice = Number(i.item.basePrice)
          const margin = Number(i.item.margin || 0.3)
          const estimatedCost = basePrice / (1 + margin)
          totalEstimatedCost += estimatedCost * i.bundleItem.quantity
        })

        // Calcular ganancia y porcentaje de ganancia
        const profit = totalDiscountedPrice - totalEstimatedCost
        const profitPercentage = totalDiscountedPrice > 0 ? (profit / totalDiscountedPrice) * 100 : 0

        return {
          ...bundle,
          items: bundleItemsWithDetails.map((i) => ({
            itemId: i.item.id,
            item: i.item,
            quantity: i.bundleItem.quantity,
            overridePrice: i.bundleItem.overridePrice ? Number(i.bundleItem.overridePrice) : undefined,
          })),
          totalBasePrice,
          totalDiscountedPrice,
          savings,
          savingsPercentage,
          totalEstimatedCost,
          profit,
          profitPercentage,
        }
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Error al obtener los bundles" }
  }
}

