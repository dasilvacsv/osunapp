'use server'

import { db } from "@/db";
import { inventoryItems, inventoryTransactions, bundleCategories, bundles, bundleItems, bundleTypeEnum, statusEnum } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  CreateInventoryItemInput,
  StockTransactionInput,
  UpdateInventoryItemInput,
  CreateBundleCategoryInput,
  CreateBundleInput
} from "./types";
import { inventoryItemSchema, stockTransactionSchema } from "./validation";
import { z } from "zod";

export async function createInventoryItem(input: CreateInventoryItemInput) {
  try {
    const validated = inventoryItemSchema.parse(input)
    const [item] = await db.insert(inventoryItems).values(validated).returning()
    revalidatePath("/inventory")
    return { success: true, data: item }
  } catch (error) {
    console.error("Error creating inventory item:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Datos de entrada inválidos: " + error.errors.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Error al crear el artículo de inventario" }
  }
}

export async function getInventoryItems() {
  try {
    const items = await db.select().from(inventoryItems);
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return { success: false, error: 'Failed to fetch inventory items' };
  }
}

export async function stockIn({ itemId, quantity, notes }: StockTransactionInput) {
  try {
    if (!itemId || quantity <= 0) {
      throw new Error("Datos inválidos: itemId y cantidad deben ser proporcionados y válidos.");
    }

    // Verificar si el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
    if (!item) {
      throw new Error("Item no encontrado.");
    }

    // Actualizar stock
    await db.update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId));

    // Registrar transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity,
      transactionType: 'IN',
      notes
    });

    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    console.error("Error en stock-in:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al realizar stock-in.",
    };
  }
}

export async function stockOut({ itemId, quantity, notes }: StockTransactionInput) {
  try {
    if (!itemId || quantity <= 0) {
      throw new Error("Datos inválidos: itemId y cantidad deben ser proporcionados y válidos.");
    }

    // Verificar si el item existe
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
    if (!item) {
      throw new Error("Item no encontrado.");
    }

    // Verificar si hay suficiente stock
    if (item.currentStock < quantity) {
      throw new Error("Stock insuficiente.");
    }

    // Actualizar stock
    await db.update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId));

    // Registrar transacción
    await db.insert(inventoryTransactions).values({
      itemId,
      quantity: -quantity,
      transactionType: 'OUT',
      notes
    });

    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    console.error("Error en stock-out:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al realizar stock-out.",
    };
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

export async function getInventoryTransactions(itemId: string) {
  try {
    const transactions = await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.itemId, itemId))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(10);

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return { success: false, error: "Failed to fetch transaction history" };
  }
}

export async function createBundleCategory(input: CreateBundleCategoryInput) {
  try {
    const [category] = await db.insert(bundleCategories).values(input).returning()

    revalidatePath("/inventory/bundles")
    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating bundle category:", error)
    return { success: false, error: "Failed to create bundle category" }
  }
}

export async function getBundleCategories() {
  try {
    const categories = await db
      .select()
      .from(bundleCategories)
      .where(eq(bundleCategories.status, 'ACTIVE'));

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching bundle categories:", error);
    return { success: false, error: "Failed to fetch bundle categories" };
  }
}

export async function createBundle(input: CreateBundleInput) {
  try {
    // Log the bundle type enum values for debugging
    console.log("Bundle type enum values:", bundleTypeEnum)

    // Crear bundle
    const [bundle] = await db
      .insert(bundles)
      .values({
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        type: "REGULAR", // Use the string value directly
        organizationId: null, // Set this if needed
        basePrice: input.totalBasePrice,
        discountPercentage: input.savingsPercentage,
        status: "ACTIVE", // Use the string value directly
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    console.log("Created bundle:", bundle) // Log the created bundle for debugging

    // Crear bundle items
    const itemsToInsert = input.items.map((item) => ({
      bundleId: bundle.id,
      itemId: item.itemId,
      quantity: item.quantity,
      overridePrice: item.overridePrice,
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
        basePrice: bundles.basePrice,
        discountPercentage: bundles.discountPercentage,
        status: bundles.status,
        createdAt: bundles.createdAt,
        updatedAt: bundles.updatedAt,
      })
      .from(bundles)
      .leftJoin(bundleCategories, eq(bundles.categoryId, bundleCategories.id)) // Unir con categorías
      .where(eq(bundles.status, 'ACTIVE')) // Filtrar solo bundles activos
      .orderBy(desc(bundles.createdAt)); // Ordenar por fecha de creación descendente

    // Consulta adicional para obtener los items de cada bundle
    const bundleItemsData = await db
      .select({
        bundleId: bundleItems.bundleId,
        itemId: bundleItems.itemId,
        itemName: inventoryItems.name, // Nombre del artículo
        quantity: bundleItems.quantity,
        overridePrice: bundleItems.overridePrice,
      })
      .from(bundleItems)
      .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id));

    // Agrupar los items por bundleId
    const groupedItems = bundleItemsData.reduce((acc, item) => {
      if (!acc[item.bundleId]) {
        acc[item.bundleId] = [];
      }
      acc[item.bundleId].push({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        overridePrice: item.overridePrice,
      });
      return acc;
    }, {} as Record<string, Array<{ itemId: string; itemName: string; quantity: number; overridePrice: number | null }>>);

    // Asociar los items a cada bundle
    const bundlesWithItems = bundlesData.map((bundle) => ({
      ...bundle,
      items: groupedItems[bundle.id] || [], // Items asociados al bundle
    }));

    return { success: true, data: bundlesWithItems };
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return { success: false, error: "Failed to fetch bundles" };
  }
}