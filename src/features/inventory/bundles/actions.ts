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
import { eq, isNotNull, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"
import type { ActionResponse, CreateBundleInput, BundleWithItems } from "../types"
import { uuid } from "drizzle-orm/pg-core"

export async function getOrganizationsWithBundles(): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .innerJoin(bundles, eq(organizations.id, bundles.organizationId))
      .groupBy(organizations.id)
      .orderBy(organizations.name)

    return { success: true, data: orgs }
  } catch (error) {
    console.error("Error fetching organizations with bundles:", error)
    return { success: false, error: "Error al obtener organizaciones" }
  }
}
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

// Crear un nuevo paquete - Ahora incluye directamente el campo notes
export async function createBundle(input: CreateBundleInput): Promise<ActionResponse<string>> {
  try {
    const bundleData = {
      name: input.name,
      description: input.description || null,
      notes: input.notes || null, // Incluimos notes directamente
      categoryId: input.categoryId,
      type: "REGULAR",
      basePrice: input.basePrice.toString(),
      bundlePrice: input.salePrice.toString(),
      discountPercentage: input.margin.toString(), // Now represents dollar value instead of percentage
      currencyType: input.currencyType || "USD",
      conversionRate: input.conversionRate ? input.conversionRate.toString() : null,
      organizationId: input.organizationId || null,
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

// Obtener un paquete específico por ID
export async function getBundleById(bundleId: string): Promise<ActionResponse<BundleWithItems>> {
  try {
    noStore()
    const bundleResult = await db
      .select({
        bundle: bundles,
        organization: {
          id: organizations.id,
          name: organizations.name,
        },
      })
      .from(bundles)
      .leftJoin(organizations, eq(bundles.organizationId, organizations.id))
      .where(eq(bundles.id, bundleId))
      .limit(1)

    if (!bundleResult.length) {
      return { success: false, error: "Paquete no encontrado" }
    }

    const { bundle, organization } = bundleResult[0]

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

    return { success: true, data: bundleWithItems }
  } catch (error) {
    console.error("Error fetching bundle by ID:", error)
    return { success: false, error: "Error al obtener el paquete" }
  }
}

// Actualizar un paquete existente - Ahora incluye directamente el campo notes
export async function updateBundle(bundleId: string, input: CreateBundleInput): Promise<ActionResponse<string>> {
  try {
    // Verificar si el paquete existe
    const bundleExists = await db.select({ id: bundles.id }).from(bundles).where(eq(bundles.id, bundleId)).limit(1)

    if (!bundleExists.length) {
      return { success: false, error: "Paquete no encontrado" }
    }

    // Actualizar los datos del paquete
    const bundleData = {
      name: input.name,
      description: input.description || null,
      notes: input.notes || null, // Incluimos notes directamente
      categoryId: input.categoryId,
      basePrice: input.basePrice.toString(),
      bundlePrice: input.salePrice.toString(),
      discountPercentage: input.margin.toString(),
      currencyType: input.currencyType || "USD",
      conversionRate: input.conversionRate ? input.conversionRate.toString() : null,
      organizationId: input.organizationId || null,
      updatedAt: new Date(),
    }

    await db.update(bundles).set(bundleData).where(eq(bundles.id, bundleId))

    // Eliminar los items actuales del paquete
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, bundleId))

    // Insertar los nuevos items
    for (const item of input.items) {
      await db.insert(bundleItems).values({
        bundleId: bundleId,
        itemId: item.itemId,
        quantity: item.quantity,
        overridePrice: null,
      })
    }

    revalidatePath("/inventario/bundles")
    return { success: true, data: bundleId }
  } catch (error) {
    console.error("Error updating bundle:", error)
    return { success: false, error: "Error al actualizar el paquete" }
  }
}

export async function cloneBundle(
  originalBundleId: string,
  newName: string
): Promise<ActionResponse<string>> {
  try {
    // Obtener el paquete original con sus relaciones
    const originalResult = await getBundleById(originalBundleId);
    if (!originalResult.success || !originalResult.data) {
      return { success: false, error: "Paquete original no encontrado" };
    }
    const originalBundle = originalResult.data;

    // Crear nuevo paquete con los datos esenciales del original
    const [newBundle] = await db
      .insert(bundles)
      .values({
        // Solo campos necesarios, sin relaciones
        name: newName,
        description: originalBundle.description,
        notes: originalBundle.notes,
        categoryId: originalBundle.categoryId,
        type: originalBundle.type,
        basePrice: originalBundle.basePrice,
        bundlePrice: originalBundle.bundlePrice,
        discountPercentage: originalBundle.discountPercentage,
        currencyType: originalBundle.currencyType,
        conversionRate: originalBundle.conversionRate,
        organizationId: originalBundle.organizationId,
        status: "ACTIVE",
        // Nuevos campos generados
        totalSales: 0,
        lastSaleDate: null,
        totalRevenue: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: bundles.id });

    if (!newBundle) throw new Error("No se pudo clonar el paquete");

    // Clonar los items del paquete
    for (const item of originalBundle.items) {
      await db.insert(bundleItems).values({
        bundleId: newBundle.id,
        itemId: item.itemId,
        quantity: item.quantity,
        overridePrice: null,
      });
    }

    revalidatePath("/inventario/bundles");
    return { success: true, data: newBundle.id };
  } catch (error) {
    console.error("Error cloning bundle:", error);
    return { success: false, error: "Error al clonar el paquete" };
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
export async function getBundles(filters?: {
  currencyType?: 'BS' | 'USD';
  organizationId?: string;
  categoryId?: string;
}): Promise<ActionResponse<BundleWithItems[]>> {
  try {
    noStore()
    
    let query = db
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
      .$dynamic();

    if (filters) {
      if (filters.currencyType) {
        query = query.where(eq(bundles.currencyType, filters.currencyType));
      }
      if (filters.organizationId) {
        query = query.where(eq(bundles.organizationId, filters.organizationId));
      }
      if (filters.categoryId) {
        query = query.where(eq(bundles.categoryId, filters.categoryId));
      }
    }

    const bundlesList = await query.orderBy(bundles.createdAt);

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

        // Cálculo del costo estimado
        let totalEstimatedCost = 0
        bundleItemsWithDetails.forEach((i) => {
          let itemCost = 0
          if (i.item.costPrice) {
            itemCost = Number(i.item.costPrice)
          } else if (i.item.basePrice && i.item.margin) {
            const itemBasePrice = Number(i.item.basePrice)
            const itemMargin = Number(i.item.margin)
            itemCost = itemBasePrice / (1 + itemMargin)
          }
          totalEstimatedCost += itemCost * i.bundleItem.quantity
        })

        const profit = salePrice - totalEstimatedCost
        const profitPercentage = salePrice > 0 ? (profit / salePrice) * 100 : 0

        return {
          ...bundle,
          organization,
          items: bundleItemsWithDetails.map((i) => ({
            itemId: i.item.id,
            item: i.item,
            quantity: i.bundleItem.quantity,
            costPrice: i.item.costPrice
              ? Number(i.item.costPrice)
              : i.item.basePrice && i.item.margin
                ? Number(i.item.basePrice) / (1 + Number(i.item.margin))
                : 0,
          })),
          totalBasePrice: basePrice,
          totalDiscountedPrice: salePrice,
          savings: 0,
          savingsPercentage: 0,
          totalEstimatedCost,
          profit,
          profitPercentage,
          currencyType: bundle.currencyType || "USD",
          conversionRate: bundle.conversionRate || "1",
        }
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { 
      success: false, 
      error: "Error al obtener los paquetes: " + (error instanceof Error ? error.message : "Error desconocido")
    }
  }
}

// Eliminar un paquete (soft delete)
export async function deleteBundle(bundleId: string, authCode: string): Promise<ActionResponse<string>> {
  try {
    // Verificar el código de autorización
    if (authCode !== "1234") {
      return { success: false, error: "Código de autorización incorrecto" }
    }

    // Verificar si el paquete existe
    const bundleExists = await db.select({ id: bundles.id }).from(bundles).where(eq(bundles.id, bundleId)).limit(1)

    if (!bundleExists.length) {
      return { success: false, error: "Paquete no encontrado" }
    }

    // Realizar un soft delete cambiando el status a INACTIVE
    await db
      .update(bundles)
      .set({
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(bundles.id, bundleId))

    revalidatePath("/inventario/bundles")
    return { success: true, data: bundleId }
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return { success: false, error: "Error al eliminar el paquete" }
  }
}
