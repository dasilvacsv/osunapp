"use server"

import { db } from "@/db"
import {
  inventoryItems,
  inventoryTransactions,
  bundleCategories,
  bundles,
  bundleItems,
  inventoryPurchases,
  inventoryPurchaseItems,
  purchaseItems, 
  purchases,
  organizations, 
} from "@/db/schema"
import { eq, desc, sql, and, gte, or, gt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type {
  CreateInventoryItemInput,
  StockTransactionInput,
  UpdateInventoryItemInput,
  CreateBundleCategoryInput,
  CreateBundleInput,
  InventoryItem,
} from "./types"


export async function getOrganizations() {
  try {
    const data = await db.select().from(organizations)
      .where(eq(organizations.status, "ACTIVE"));
    return { data };
  } catch (error) {
    return { error: "Failed to fetch organizations" };
  }
}

export async function getInventoryItems() {
  try {
    const data = await db.select().from(inventoryItems)
      .where(eq(inventoryItems.status, "ACTIVE"));
    return { data };
  } catch (error) {
    return { error: "Failed to fetch inventory items" };
  }
}

export async function createBundleCategory(input: CreateBundleCategoryInput) {
  try {
    const [category] = await db.insert(bundleCategories).values(input).returning()

    revalidatePath("/bundles")
    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating bundle category:", error)
    return { success: false, error: "Failed to create bundle category" }
  }
}

export async function getBundleCategories() {
  try {
    const categories = await db.select().from(bundleCategories).where(eq(bundleCategories.status, "ACTIVE"))

    return { success: true, data: categories }
  } catch (error) {
    console.error("Error fetching bundle categories:", error)
    return { success: false, error: "Failed to fetch bundle categories" }
  }
}

export async function createBundle(input: CreateBundleInput) {
  try {
    // Crear bundle
    const [bundle] = await db
      .insert(bundles)
      .values({
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        type: "REGULAR", // Use the string value directly
        organizationId: input.organizationId || null, // Use the provided organizationId or null
        basePrice: input.totalBasePrice.toString(),
        bundlePrice: input.bundlePrice.toString(), // Save the bundle price as string
        discountPercentage: input.savingsPercentage.toString(),
        status: "ACTIVE", // Use the string value directly
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Crear bundle items
    const itemsToInsert = input.items.map((item) => ({
      bundleId: bundle.id,
      itemId: item.itemId,
      quantity: item.quantity,
      overridePrice: item.overridePrice !== undefined && item.overridePrice !== null 
        ? item.overridePrice.toString() 
        : null, // If no override price is provided, use null to indicate we should use the base price
    }))

    await db.insert(bundleItems).values(itemsToInsert)

    // Reservar stock
    const reserveResult = await reserveStockForBundle(bundle.id)
    if (!reserveResult.success) {
      throw new Error(reserveResult.error)
    }

    revalidatePath("/inventory/bundles")
    return { success: true, data: bundle }
  } catch (error) {
    console.error("Error creating bundle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al crear bundle.",
    }
  }
}

export async function getBundles() {
  try {
    // Consulta principal para obtener los bundles
    const bundlesData = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        description: bundles.description,
        type: bundles.type,
        categoryId: bundles.categoryId,
        categoryName: bundleCategories.name, // Nombre de la categoría asociada
        organizationId: bundles.organizationId,
        organizationName: organizations.name, // Organization name
        organizationType: organizations.type, // Organization type
        basePrice: bundles.basePrice,
        bundlePrice: bundles.bundlePrice, // Include bundle price
        discountPercentage: bundles.discountPercentage,
        status: bundles.status,
        createdAt: bundles.createdAt,
        updatedAt: bundles.updatedAt,
      })
      .from(bundles)
      .leftJoin(bundleCategories, eq(bundles.categoryId, bundleCategories.id)) // Join with categories
      .leftJoin(organizations, eq(bundles.organizationId, organizations.id)) // Join with organizations
      .where(eq(bundles.status, "ACTIVE")) // Filter only active bundles
      .orderBy(desc(bundles.createdAt)) // Order by creation date descending

    // Consulta adicional para obtener los items de cada bundle
    const bundleItemsData = await db
      .select({
        bundleId: bundleItems.bundleId,
        itemId: bundleItems.itemId,
        itemName: inventoryItems.name, // Item name
        basePrice: inventoryItems.basePrice, // Item base price
        quantity: bundleItems.quantity,
        overridePrice: bundleItems.overridePrice,
      })
      .from(bundleItems)
      .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))

    // Agrupar los items por bundleId
    const groupedItems = bundleItemsData.reduce(
      (acc, item) => {
        if (!acc[item.bundleId]) {
          acc[item.bundleId] = []
        }
        acc[item.bundleId].push({
          itemId: item.itemId,
          itemName: item.itemName,
          basePrice: Number(item.basePrice),
          quantity: item.quantity,
          overridePrice: item.overridePrice !== null ? Number(item.overridePrice) : null,
        })
        return acc
      },
      {} as Record<string, Array<{ 
        itemId: string; 
        itemName: string; 
        basePrice: number;
        quantity: number; 
        overridePrice: number | null 
      }>>,
    )

    // Calculate additional bundle metrics
    const bundlesWithItems = bundlesData.map((bundle) => {
      const items = groupedItems[bundle.id] || [];
      
      // Calculate total base price (sum of all items' base price * quantity)
      const totalBasePrice = items.reduce((acc, item) => {
        return acc + (item.basePrice * item.quantity);
      }, 0);
      
      // Calculate total bundle price (sum of all items' override price or base price * quantity)
      const totalBundlePrice = items.reduce((acc, item) => {
        const price = item.overridePrice !== null ? item.overridePrice : item.basePrice;
        return acc + (price * item.quantity);
      }, 0);
      
      // Calculate savings
      const savings = totalBasePrice - totalBundlePrice;
      const savingsPercentage = totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0;
      
      return {
        ...bundle,
        items,
        totalBasePrice,
        totalBundlePrice,
        savings,
        savingsPercentage,
      };
    });

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Failed to fetch bundles" }
  }
}

async function reserveStockForBundle(bundleId: string) {
  try {
    const bundleItemsData = await db.select().from(bundleItems).where(eq(bundleItems.bundleId, bundleId))

    for (const item of bundleItemsData) {
      const [inventoryItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId))

      if (!inventoryItem) {
        throw new Error(`Item con ID ${item.itemId} no encontrado.`)
      }

      if (inventoryItem.currentStock - inventoryItem.reservedStock < item.quantity) {
        throw new Error(`Stock insuficiente para reservar el item con ID ${item.itemId}.`)
      }

      await db
        .update(inventoryItems)
        .set({
          reservedStock: sql`${inventoryItems.reservedStock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, item.itemId))
    }

    return { success: true }
  } catch (error) {
    console.error("Error reservando stock:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al reservar stock." }
  }
}