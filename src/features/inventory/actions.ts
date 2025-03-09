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
} from "@/db/schema"
import { eq, desc, sql, and, gte, or, gt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type {
  CreateInventoryItemInput,
  StockTransactionInput,
  UpdateInventoryItemInput,
  CreateBundleCategoryInput,
  CreateBundleInput,
} from "./types"
import { inventoryItemSchema, purchaseSchema } from "./validation"
import { z } from "zod"

export async function createInventoryItem(input: CreateInventoryItemInput) {
  try {
    const validated = inventoryItemSchema.parse(input)

    // Crear el item de inventario
    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...validated,
        status: validated.status || ("ACTIVE" as any),
      })
      .returning()

    // Crear transacción de inventario inicial si el stock es mayor a 0
    if (validated.currentStock > 0) {
      await db.insert(inventoryTransactions).values({
        itemId: item.id,
        quantity: validated.currentStock,
        transactionType: "INITIAL",
        notes: "Initial inventory stock",
        createdAt: new Date(),
      })
    }

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

export async function getInventoryItems() {
  try {
    const items = await db.select().from(inventoryItems)
    return { success: true, data: items }
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return { success: false, error: "Failed to fetch inventory items" }
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
      .limit(10)

    return { success: true, data: transactions }
  } catch (error) {
    console.error("Error fetching transaction history:", error)
    return { success: false, error: "Failed to fetch transaction history" }
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
        organizationId: null, // Set this if needed
        basePrice: input.totalBasePrice.toFixed(2),
        discountPercentage: input.savingsPercentage,
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
      overridePrice: item.overridePrice !== undefined && item.overridePrice !== null ? item.overridePrice : null,
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
      .where(eq(bundles.status, "ACTIVE")) // Filtrar solo bundles activos
      .orderBy(desc(bundles.createdAt)) // Ordenar por fecha de creación descendente

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
          quantity: item.quantity,
          overridePrice: item.overridePrice !== null ? Number(item.overridePrice) : null,
        })
        return acc
      },
      {} as Record<string, Array<{ itemId: string; itemName: string; quantity: number; overridePrice: number | null }>>,
    )

    // Asociar los items a cada bundle
    const bundlesWithItems = bundlesData.map((bundle) => ({
      ...bundle,
      items: groupedItems[bundle.id] || [], // Items asociados al bundle
    }))

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Failed to fetch bundles" }
  }
}

export async function getInventoryItem(id: string) {
  try {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id))

    return { success: true, data: item }
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return { success: false, error: "Error obteniendo producto" }
  }
}

export async function updateInventoryItem(id: string, data: UpdateInventoryItemInput) {
  try {
    const [updated] = await db
      .update(inventoryItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning()

    revalidatePath("/inventory")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return { success: false, error: "Error actualizando producto" }
  }
}

export async function disableInventoryItem(id: string) {
  try {
    const [updated] = await db
      .update(inventoryItems)
      .set({
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning()

    revalidatePath("/inventory")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error disabling inventory item:", error)
    return { success: false, error: "Error desactivando producto" }
  }
}

export async function checkStockAlerts() {
  try {
    const lowStockItems = await db.query.inventoryItems.findMany({
      where: (items, { and, lt, gt, eq }) =>
        and(lt(items.currentStock, items.minimumStock), gt(items.minimumStock, 0), eq(items.status, "ACTIVE")),
    })

    return lowStockItems.map((item) => ({
      itemId: item.id,
      message: `${item.name} está por debajo del stock mínimo (${item.currentStock}/${item.minimumStock})`,
    }))
  } catch (error) {
    console.error("Error checking stock alerts:", error)
    return []
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

// Completely revised implementation that uses actual order data
export async function getTopSellingItems() {
  try {
    // Get the date from 3 months ago
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Query to get sales data from order items
    const salesFromOrders = await db
      .select({
        itemId: orderItems.itemId,
        totalQuantity: sql`SUM(${orderItems.quantity})`,
        totalRevenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(inventoryItems, eq(orderItems.itemId, inventoryItems.id))
      .where(
        and(
          or(eq(orders.status, "COMPLETED"), eq(orders.status, "PAID"), eq(orders.status, "DELIVERED")),
          gte(orders.createdAt, threeMonthsAgo),
        ),
      )
      .groupBy(orderItems.itemId)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10)

    // Get the inventory item details for these items
    const itemIds = salesFromOrders.map((sale) => sale.itemId)

    if (itemIds.length === 0) {
      // Fallback if no sales data yet
      const popularItems = await db
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          currentStock: inventoryItems.currentStock,
          basePrice: inventoryItems.basePrice,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.status, "ACTIVE"))
        .orderBy(desc(inventoryItems.updatedAt))
        .limit(7)

      // Generate simulated sales data for demo purposes
      return {
        success: true,
        data: popularItems.map((item, index) => ({
          id: item.id,
          name: item.name,
          sales: 100 - index * 12, // Simulated sales data
          revenue: (100 - index * 12) * Number(item.basePrice),
        })),
      }
    }

    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
      })
      .from(inventoryItems)
      .where(sql`${inventoryItems.id} IN (${itemIds.join(",")})`)

    // Map item details to sales data
    const result = salesFromOrders.map((sale) => {
      const item = items.find((item) => item.id === sale.itemId)
      return {
        id: sale.itemId,
        name: item?.name || "Unknown Item",
        sales: Number(sale.totalQuantity),
        revenue: Number(sale.totalRevenue),
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching top selling items:", error)
    return { success: false, error: "Error obteniendo productos más vendidos" }
  }
}

// Enhanced inventory predictions with exponential forecasting
export async function getInventoryPredictions() {
  try {
    // Get all active inventory items with their transaction history
    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        sku: inventoryItems.sku,
        currentStock: inventoryItems.currentStock,
        minimumStock: inventoryItems.minimumStock,
        basePrice: inventoryItems.basePrice,
      })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.status, "ACTIVE"), gt(inventoryItems.minimumStock, 0)))
      .limit(20)

    // Get sales transactions for these items
    const itemIds = items.map((item) => item.id)

    // Get order data for last 90 days to analyze trends
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Get orders for these items from the last 90 days
    const salesData = await db
      .select({
        itemId: orderItems.itemId,
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        orderDate: orders.createdAt,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          sql`${orderItems.itemId} IN (${itemIds.join(",")})`,
          gte(orders.createdAt, ninetyDaysAgo),
          or(eq(orders.status, "COMPLETED"), eq(orders.status, "PAID"), eq(orders.status, "DELIVERED")),
        ),
      )

    // Group sales by item and calculate monthly trends
    const salesByItem: Record<
      string,
      {
        totalQuantity: number
        monthlySales: Record<number, number>
        salesDates: Date[]
      }
    > = {}

    salesData.forEach((sale) => {
      if (!salesByItem[sale.itemId]) {
        salesByItem[sale.itemId] = {
          totalQuantity: 0,
          monthlySales: {},
          salesDates: [],
        }
      }

      salesByItem[sale.itemId].totalQuantity += Number(sale.quantity)

      const month = sale.orderDate.getMonth()
      if (!salesByItem[sale.itemId].monthlySales[month]) {
        salesByItem[sale.itemId].monthlySales[month] = 0
      }
      salesByItem[sale.itemId].monthlySales[month] += Number(sale.quantity)
      salesByItem[sale.itemId].salesDates.push(sale.orderDate)
    })

    // Calculate predictions for each item
    const predictions = items.map((item) => {
      const salesInfo = salesByItem[item.id] || { totalQuantity: 0, monthlySales: {}, salesDates: [] }

      // Calculate daily consumption rate based on sales pattern
      const currentMonth = new Date().getMonth()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const twoMonthsAgo = lastMonth === 0 ? 11 : lastMonth - 1

      const currentMonthSales = salesInfo.monthlySales[currentMonth] || 0
      const lastMonthSales = salesInfo.monthlySales[lastMonth] || 0
      const twoMonthsAgoSales = salesInfo.monthlySales[twoMonthsAgo] || 0

      // Calculate exponential growth/trend factor
      let growthFactor = 1.0 // Default: stable

      if (lastMonthSales > 0 && twoMonthsAgoSales > 0) {
        // Month-over-month growth rate
        const mom1 = lastMonthSales / twoMonthsAgoSales
        const mom2 = currentMonthSales / Math.max(1, lastMonthSales)

        // Weighted average with more emphasis on recent trend
        growthFactor = mom1 * 0.4 + mom2 * 0.6

        // Limit extreme values
        growthFactor = Math.max(0.5, Math.min(2.0, growthFactor))
      } else if (lastMonthSales > 0) {
        // Only have one month of data
        growthFactor = currentMonthSales / Math.max(1, lastMonthSales)
        growthFactor = Math.max(0.7, Math.min(1.5, growthFactor))
      }

      // Calculate expected daily sales based on recent data and growth trend
      const daysInData =
        salesInfo.salesDates.length > 0
          ? Math.max(1, (Date.now() - salesInfo.salesDates[0].getTime()) / (1000 * 60 * 60 * 24))
          : 30 // Default to 30 days if no sales data

      // Base daily rate from historical data
      const dailyRate = salesInfo.totalQuantity / daysInData

      // Apply growth factor for future projection
      const projectedDailyRate = dailyRate * growthFactor

      // Ensure we have at least a minimum rate if there's any sales history
      const effectiveDailyRate =
        salesInfo.totalQuantity > 0 ? Math.max(0.1, projectedDailyRate) : Math.max(0.05, projectedDailyRate)

      // Calculate days until stockout with the projected rate
      const daysUntilStockout = Math.round(item.currentStock / Math.max(0.1, effectiveDailyRate))

      // Project stock in 30 days
      const projectedStock = Math.round(item.currentStock - effectiveDailyRate * 30)

      // Calculate how much to order based on lead time and safety stock
      const leadTimeDays = 7 // Assume 7 days to receive new stock
      const safetyStockDays = 14 // 2 weeks safety stock
      const reorderPoint = Math.ceil(effectiveDailyRate * (leadTimeDays + safetyStockDays))

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        projectedStock: projectedStock,
        daysUntilStockout: daysUntilStockout,
        dailyConsumptionRate: effectiveDailyRate.toFixed(2),
        reorderPoint,
        minimumStock: item.minimumStock,
        growthTrend: growthFactor > 1 ? "increasing" : growthFactor < 1 ? "decreasing" : "stable",
        totalSales: salesInfo.totalQuantity,
      }
    })

    // Sort by days until stockout (ascending)
    const sortedPredictions = predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

    return {
      success: true,
      data: sortedPredictions,
    }
  } catch (error) {
    console.error("Error fetching inventory predictions:", error)
    return { success: false, error: "Error obteniendo proyecciones de inventario" }
  }
}

