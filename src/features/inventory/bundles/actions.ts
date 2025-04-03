"use server"

import { db } from "@/db"
import { bundleCategories, bundles, bundleItems, inventoryItems, organizations } from "@/db/schema"
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

export async function createBundleCategory(
  input: { name: string }
): Promise<ActionResponse<{ id: string; name: string }>> {
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
        name: bundleCategories.name
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

// Crear un nuevo bundle - Modificado para no usar transacciones
export async function createBundle(input: CreateBundleInput): Promise<ActionResponse<string>> {
  try {
    const [bundle] = await db
      .insert(bundles)
      .values({
        name: input.name,
        description: input.description || null,
        categoryId: input.categoryId,
        type: "REGULAR",
        basePrice: input.totalBasePrice.toString(),
        discountPercentage: input.savingsPercentage.toString(),
        bundlePrice: (input.totalBasePrice * (1 - input.savingsPercentage / 100)).toString(),
        currencyType: input.currencyType || "USD",
        conversionRate: input.conversionRate ? input.conversionRate.toString() : null,
        organizationId: input.organizationId || null,
      })
      .returning({ id: bundles.id })

    if (!bundle) throw new Error("No se pudo crear el bundle")

    for (const item of input.items) {
      await db.insert(bundleItems).values({
        bundleId: bundle.id,
        itemId: item.itemId,
        quantity: item.quantity,
        overridePrice: item.overridePrice ? item.overridePrice.toString() : null,
      })
    }

    revalidatePath("/inventario/bundles")
    return { success: true, data: bundle.id }
  } catch (error) {
    console.error("Error creating bundle:", error)
    return { success: false, error: "Error al crear el bundle" }
  }
}

export async function getOrganizations(): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    noStore()
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name
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
// Obtener todos los bundles con sus items
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

        const totalBasePrice = Number(bundle.basePrice)
        const discountPercentage = Number(bundle.discountPercentage || 0)
        const totalDiscountedPrice = totalBasePrice * (1 - discountPercentage / 100)
        const savings = totalBasePrice - totalDiscountedPrice
        const savingsPercentage = totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0

        let totalEstimatedCost = 0
        bundleItemsWithDetails.forEach((i) => {
          const basePrice = Number(i.item.basePrice)
          const margin = Number(i.item.margin || 0.3)
          const estimatedCost = basePrice / (1 + margin)
          totalEstimatedCost += estimatedCost * i.bundleItem.quantity
        })

        const profit = totalDiscountedPrice - totalEstimatedCost
        const profitPercentage = totalDiscountedPrice > 0 ? (profit / totalDiscountedPrice) * 100 : 0

        return {
          ...bundle,
          organization,
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
          currencyType: bundle.currencyType || "USD",
          conversionRate: bundle.conversionRate || "1",
        }
      })
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Error al obtener los bundles" }
  }
}
