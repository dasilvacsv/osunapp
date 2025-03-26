"use server"

import { db } from "@/db"
import {
  purchases,
  purchaseItems,
  inventoryItems,
  inventoryTransactions,
  clients,
  bundles,
  beneficiarios,
  organizations,
  payments,
  paymentPlans,
  dailySalesReports,
} from "@/db/schema"
import { and, eq, sql, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Get a single purchase by ID
export async function getPurchaseById(id: string) {
  try {
    const [purchase] = await db
      .select({
        // Purchase information
        id: purchases.id,
        clientId: purchases.clientId,
        bundleId: purchases.bundleId,
        beneficiarioId: purchases.beneficiarioId,
        organizationId: purchases.organizationId,
        status: purchases.status,
        totalAmount: purchases.totalAmount,
        paymentStatus: purchases.paymentStatus,
        paymentMethod: purchases.paymentMethod,
        paymentType: purchases.paymentType,
        purchaseDate: purchases.purchaseDate,
        transactionReference: purchases.transactionReference,
        bookingMethod: purchases.bookingMethod,
        isPaid: sql`COALESCE(${purchases.isPaid}, false)`,
        paymentMetadata: purchases.paymentMetadata,
        isDraft: sql`COALESCE(${purchases.isDraft}, false)`,
        vendido: sql`COALESCE(${purchases.vendido}, false)`,
        currencyType: purchases.currencyType,
        conversionRate: purchases.conversionRate,

        // Client information
        client: clients,

        // Organization information
        organization: organizations,

        // Beneficiario information
        beneficiario: beneficiarios,

        // Bundle information
        bundle: bundles,

        // Extract saleType from paymentMetadata
        saleType: sql`COALESCE((${purchases.paymentMetadata}->>'saleType')::text, 'DIRECT')`,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .where(eq(purchases.id, id))

    if (!purchase) {
      return { success: false, error: "Purchase not found" }
    }

    // Get payment plans for this purchase
    const paymentPlansData = await db.select().from(paymentPlans).where(eq(paymentPlans.purchaseId, id))

    // Get payments for this purchase
    const paymentsData = await db.select().from(payments).where(eq(payments.purchaseId, id))

    // Get purchase items with inventory item details
    const items = await db
      .select({
        purchaseItem: purchaseItems,
        inventoryItem: inventoryItems,
      })
      .from(purchaseItems)
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .where(eq(purchaseItems.purchaseId, id))

    return {
      success: true,
      data: {
        ...purchase,
        paymentPlans: paymentPlansData,
        payments: paymentsData,
        items,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase:", error)
    return { success: false, error: "Failed to fetch purchase" }
  }
}

// Create a new purchase
export async function createPurchase(data: any) {
  try {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the purchase
      const [purchase] = await tx
        .insert(purchases)
        .values({
          clientId: data.clientId,
          beneficiarioId: data.beneficiarioId,
          bundleId: data.bundleId,
          organizationId: data.organizationId,
          status: data.status || "PENDING",
          totalAmount: data.totalAmount.toString(),
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference,
          paymentMetadata: data.paymentMetadata || {},
          isPaid: data.isPaid || false,
          isDraft: data.isDraft || false,
          currencyType: data.currencyType || "USD",
          conversionRate: data.conversionRate?.toString() || "1",
        })
        .returning()

      // Create purchase items
      if (data.items && data.items.length > 0) {
        const purchaseItemsData = data.items.map((item: any) => ({
          purchaseId: purchase.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          metadata: item.metadata || {},
        }))

        await tx.insert(purchaseItems).values(purchaseItemsData)

        // Update inventory if not a draft
        if (!data.isDraft) {
          for (const item of data.items) {
            // Create inventory transaction
            await tx.insert(inventoryTransactions).values({
              itemId: item.itemId,
              quantity: -item.quantity, // Negative for outgoing
              transactionType: "OUT",
              reference: { purchaseId: purchase.id },
              notes: `Sale: ${purchase.id}`,
            })

            // Update inventory item stock
            await tx
              .update(inventoryItems)
              .set({
                currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(inventoryItems.id, item.itemId))
          }
        }
      }

      // Create payment if paid
      if (data.isPaid) {
        await tx.insert(payments).values({
          purchaseId: purchase.id,
          amount: data.totalAmount.toString(),
          status: "PAID",
          paymentDate: new Date(),
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference,
          currencyType: data.currencyType || "USD",
          originalAmount: data.totalAmount.toString(),
          conversionRate: data.conversionRate?.toString() || "1",
        })
      }

      return {
        success: true,
        data: purchase,
      }
    })
  } catch (error) {
    console.error("Error creating purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create purchase",
    }
  }
}

// Update a purchase
export async function updatePurchase(id: string, data: any) {
  try {
    const [updatedPurchase] = await db
      .update(purchases)
      .set({
        clientId: data.clientId,
        beneficiarioId: data.beneficiarioId,
        bundleId: data.bundleId,
        organizationId: data.organizationId,
        status: data.status,
        totalAmount: data.totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference,
        paymentMetadata: data.paymentMetadata || {},
        isPaid: data.isPaid || false,
        updatedAt: new Date(),
        isDraft: data.isDraft || false,
        currencyType: data.currencyType || "USD",
        conversionRate: data.conversionRate?.toString() || "1",
      })
      .where(eq(purchases.id, id))
      .returning()

    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedPurchase,
    }
  } catch (error) {
    console.error("Error updating purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update purchase",
    }
  }
}

// Delete a purchase
export async function deletePurchase(id: string) {
  try {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Get purchase items to restore inventory
      const purchaseItemsData = await tx.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id))

      // Delete related payments
      await tx.delete(payments).where(eq(payments.purchaseId, id))

      // Delete related payment plans
      await tx.delete(paymentPlans).where(eq(paymentPlans.purchaseId, id))

      // Delete purchase items
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id))

      // Delete the purchase
      const [deletedPurchase] = await tx.delete(purchases).where(eq(purchases.id, id)).returning()

      // Restore inventory for non-draft purchases
      if (!deletedPurchase.isDraft) {
        for (const item of purchaseItemsData) {
          // Create inventory transaction
          await tx.insert(inventoryTransactions).values({
            itemId: item.itemId,
            quantity: item.quantity, // Positive for incoming (restoring)
            transactionType: "ADJUSTMENT",
            reference: { deletedPurchaseId: id },
            notes: `Deleted Sale: ${id}`,
          })

          // Update inventory item stock
          await tx
            .update(inventoryItems)
            .set({
              currentStock: sql`${inventoryItems.currentStock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.itemId))
        }
      }

      revalidatePath("/sales")

      return {
        success: true,
        data: deletedPurchase,
      }
    })
  } catch (error) {
    console.error("Error deleting purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete purchase",
    }
  }
}

// Get sales data
export async function getSalesData2() {
  try {
    const sales = await db
      .select({
        // Purchase information
        id: purchases.id,
        clientId: purchases.clientId,
        bundleId: purchases.bundleId,
        beneficiarioId: purchases.beneficiarioId,
        organizationId: purchases.organizationId,
        status: purchases.status,
        totalAmount: purchases.totalAmount,
        paymentStatus: purchases.paymentStatus,
        paymentMethod: purchases.paymentMethod,
        paymentType: purchases.paymentType,
        purchaseDate: purchases.purchaseDate,
        transactionReference: purchases.transactionReference,
        bookingMethod: purchases.bookingMethod,
        isPaid: sql`COALESCE(${purchases.isPaid}, false)`,
        paymentMetadata: purchases.paymentMetadata,
        isDraft: sql`COALESCE(${purchases.isDraft}, false)`,
        vendido: sql`COALESCE(${purchases.vendido}, false)`,
        currencyType: purchases.currencyType,
        conversionRate: purchases.conversionRate,

        // Client information
        client: clients,

        // Organization information
        organization: organizations,

        // Beneficiario information
        beneficiario: beneficiarios,

        // Bundle information
        bundle: bundles,

        // Extract saleType from paymentMetadata
        saleType: sql`COALESCE((${purchases.paymentMetadata}->>'saleType')::text, 'DIRECT')`,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .where(eq(purchases.isDraft, false))
      .orderBy(sql`${purchases.purchaseDate} DESC`)

    // For each sale, fetch related payment plans and purchase items
    const enhancedSales = await Promise.all(
      sales.map(async (sale) => {
        // Get payment plans for this purchase
        const relatedPaymentPlans = await db.select().from(paymentPlans).where(eq(paymentPlans.purchaseId, sale.id))

        // Get payments for this purchase
        const relatedPayments = await db.select().from(payments).where(eq(payments.purchaseId, sale.id))

        // Get purchase items with inventory item details
        const relatedItems = await db
          .select({
            purchaseItem: purchaseItems,
            inventoryItem: inventoryItems,
          })
          .from(purchaseItems)
          .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
          .where(eq(purchaseItems.purchaseId, sale.id))

        return {
          ...sale,
          paymentPlans: relatedPaymentPlans,
          payments: relatedPayments,
          items: relatedItems,
        }
      }),
    )

    return {
      success: true,
      data: enhancedSales,
    }
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return { success: false, error: "Failed to fetch sales data" }
  }
}

// Get draft sales
export async function getDraftSalesData() {
  try {
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
        isPaid: sql`COALESCE(${purchases.isPaid}, false)`,
        isDraft: sql`COALESCE(${purchases.isDraft}, false)`,
        vendido: sql`COALESCE(${purchases.vendido}, false)`,
        isDonation: sql`COALESCE(${purchases.isDonation}, false)`,
        currencyType: purchases.currencyType,
        conversionRate: purchases.conversionRate,
        client: clients,
        organization: organizations,
        saleType: sql`COALESCE((${purchases.paymentMetadata}->>'saleType')::text, 'DIRECT')`,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .where(eq(purchases.isDraft, true))
      .orderBy(sql`${purchases.purchaseDate} DESC`)

    return {
      success: true,
      data: sales,
    }
  } catch (error) {
    console.error("Error al obtener datos de ventas en borrador:", error)
    return { success: false, error: "Error al obtener datos de ventas en borrador" }
  }
}

// Update sale draft status
export async function updateSaleDraftStatus(id: string, isDraft: boolean) {
  try {
    const [updatedSale] = await db
      .update(purchases)
      .set({
        isDraft: isDraft,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedSale,
    }
  } catch (error) {
    console.error("Error updating draft status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating draft status",
    }
  }
}

// Update sale vendido status
export async function updateSaleVendidoStatus(id: string, vendido: boolean) {
  try {
    const [updatedSale] = await db
      .update(purchases)
      .set({
        vendido: vendido,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedSale,
    }
  } catch (error) {
    console.error("Error updating vendido status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating vendido status",
    }
  }
}

// Update sale currency
export async function updateSaleCurrency(id: string, currencyType: string, conversionRate: number) {
  try {
    const [updatedSale] = await db
      .update(purchases)
      .set({
        currencyType: currencyType,
        conversionRate: conversionRate.toString(),
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedSale,
    }
  } catch (error) {
    console.error("Error updating currency:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating currency",
    }
  }
}

// Get daily sales report
export async function getDailySalesReport(date: Date) {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split("T")[0]
    const startDate = new Date(`${formattedDate}T00:00:00.000Z`)
    const endDate = new Date(`${formattedDate}T23:59:59.999Z`)

    // Get direct sales for the day
    const directSales = await db
      .select({
        totalAmount: sql`SUM(CAST(${purchases.totalAmount} AS DECIMAL))`,
        totalUSD: sql`SUM(CASE WHEN ${purchases.currencyType} = 'USD' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) / CAST(${purchases.conversionRate} AS DECIMAL) END)`,
        totalBS: sql`SUM(CASE WHEN ${purchases.currencyType} = 'BS' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) * CAST(${purchases.conversionRate} AS DECIMAL) END)`,
        count: sql`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          gte(purchases.purchaseDate, startDate),
          lte(purchases.purchaseDate, endDate),
          eq(purchases.isDraft, false),
          eq(sql`(${purchases.paymentMetadata}->>'saleType')::text`, "DIRECT"),
        ),
      )

    // Get payments for the day
    const paymentsData = await db
      .select({
        totalAmount: sql`SUM(CAST(${payments.amount} AS DECIMAL))`,
        totalUSD: sql`SUM(CASE WHEN ${payments.currencyType} = 'USD' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) / CAST(${payments.conversionRate} AS DECIMAL) END)`,
        totalBS: sql`SUM(CASE WHEN ${payments.currencyType} = 'BS' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) * CAST(${payments.conversionRate} AS DECIMAL) END)`,
        count: sql`COUNT(*)`,
      })
      .from(payments)
      .where(and(gte(payments.paymentDate, startDate), lte(payments.paymentDate, endDate), eq(payments.status, "PAID")))

    // Check if a report already exists for this date
    const existingReport = await db
      .select()
      .from(dailySalesReports)
      .where(eq(dailySalesReports.date, startDate))
      .limit(1)

    let report

    if (existingReport.length > 0) {
      // Update existing report
      ;[report] = await db
        .update(dailySalesReports)
        .set({
          totalDirectSales: directSales[0]?.totalAmount?.toString() || "0",
          totalPayments: paymentsData[0]?.totalAmount?.toString() || "0",
          totalSalesUSD: directSales[0]?.totalUSD?.toString() || "0",
          totalSalesBS: directSales[0]?.totalBS?.toString() || "0",
          updatedAt: new Date(),
          metadata: {
            directSalesCount: directSales[0]?.count || 0,
            paymentsCount: paymentsData[0]?.count || 0,
            paymentsUSD: paymentsData[0]?.totalUSD || 0,
            paymentsBS: paymentsData[0]?.totalBS || 0,
          },
        })
        .where(eq(dailySalesReports.id, existingReport[0].id))
        .returning()
    } else {
      // Create new report
      ;[report] = await db
        .insert(dailySalesReports)
        .values({
          date: startDate,
          totalDirectSales: directSales[0]?.totalAmount?.toString() || "0",
          totalPayments: paymentsData[0]?.totalAmount?.toString() || "0",
          totalSalesUSD: directSales[0]?.totalUSD?.toString() || "0",
          totalSalesBS: directSales[0]?.totalBS?.toString() || "0",
          metadata: {
            directSalesCount: directSales[0]?.count || 0,
            paymentsCount: paymentsData[0]?.count || 0,
            paymentsUSD: paymentsData[0]?.totalUSD || 0,
            paymentsBS: paymentsData[0]?.totalBS || 0,
          },
        })
        .returning()
    }

    return {
      success: true,
      data: {
        report,
        directSales: {
          total: directSales[0]?.totalAmount || 0,
          totalUSD: directSales[0]?.totalUSD || 0,
          totalBS: directSales[0]?.totalBS || 0,
          count: directSales[0]?.count || 0,
        },
        payments: {
          total: paymentsData[0]?.totalAmount || 0,
          totalUSD: paymentsData[0]?.totalUSD || 0,
          totalBS: paymentsData[0]?.totalBS || 0,
          count: paymentsData[0]?.count || 0,
        },
      },
    }
  } catch (error) {
    console.error("Error generating daily sales report:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generating daily sales report",
    }
  }
}

// Update purchase status
export async function updatePurchaseStatus(id: string, status: string) {
  try {
    const [updatedPurchase] = await db
      .update(purchases)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedPurchase,
    }
  } catch (error) {
    console.error("Error updating purchase status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating purchase status",
    }
  }
}

// Get sales statistics
export async function getSalesStatistics(period: "day" | "week" | "month" | "year" = "month") {
  try {
    let startDate: Date
    const now = new Date()

    // Calculate start date based on period
    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        const day = now.getDay()
        startDate = new Date(now.setDate(now.getDate() - day))
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get sales statistics
    const salesStats = await db
      .select({
        totalSales: sql`COUNT(*)`,
        totalAmount: sql`SUM(CAST(${purchases.totalAmount} AS DECIMAL))`,
        totalUSD: sql`SUM(CASE WHEN ${purchases.currencyType} = 'USD' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) / CAST(${purchases.conversionRate} AS DECIMAL) END)`,
        totalBS: sql`SUM(CASE WHEN ${purchases.currencyType} = 'BS' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) * CAST(${purchases.conversionRate} AS DECIMAL) END)`,
        paidSales: sql`SUM(CASE WHEN ${purchases.isPaid} = true THEN 1 ELSE 0 END)`,
        pendingSales: sql`SUM(CASE WHEN ${purchases.isPaid} = false THEN 1 ELSE 0 END)`,
        draftSales: sql`SUM(CASE WHEN ${purchases.isDraft} = true THEN 1 ELSE 0 END)`,
        vendidoSales: sql`SUM(CASE WHEN ${purchases.vendido} = true THEN 1 ELSE 0 END)`,
      })
      .from(purchases)
      .where(gte(purchases.purchaseDate, startDate))

    // Get payment statistics
    const paymentStats = await db
      .select({
        totalPayments: sql`COUNT(*)`,
        totalAmount: sql`SUM(CAST(${payments.amount} AS DECIMAL))`,
        totalUSD: sql`SUM(CASE WHEN ${payments.currencyType} = 'USD' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) / CAST(${payments.conversionRate} AS DECIMAL) END)`,
        totalBS: sql`SUM(CASE WHEN ${payments.currencyType} = 'BS' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) * CAST(${payments.conversionRate} AS DECIMAL) END)`,
      })
      .from(payments)
      .where(and(gte(payments.paymentDate, startDate), eq(payments.status, "PAID")))

    return {
      success: true,
      data: {
        period,
        startDate,
        endDate: new Date(),
        sales: {
          total: salesStats[0]?.totalSales || 0,
          totalAmount: salesStats[0]?.totalAmount || 0,
          totalUSD: salesStats[0]?.totalUSD || 0,
          totalBS: salesStats[0]?.totalBS || 0,
          paid: salesStats[0]?.paidSales || 0,
          pending: salesStats[0]?.pendingSales || 0,
          draft: salesStats[0]?.draftSales || 0,
          vendido: salesStats[0]?.vendidoSales || 0,
        },
        payments: {
          total: paymentStats[0]?.totalPayments || 0,
          totalAmount: paymentStats[0]?.totalAmount || 0,
          totalUSD: paymentStats[0]?.totalUSD || 0,
          totalBS: paymentStats[0]?.totalBS || 0,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching sales statistics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching sales statistics",
    }
  }
}

// Get top selling products
export async function getTopSellingProducts(limit = 10, period: "week" | "month" | "year" = "month") {
  try {
    let startDate: Date
    const now = new Date()

    // Calculate start date based on period
    switch (period) {
      case "week":
        const day = now.getDay()
        startDate = new Date(now.setDate(now.getDate() - day))
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get top selling products
    const topProducts = await db
      .select({
        itemId: inventoryItems.id,
        itemName: inventoryItems.name,
        itemSku: inventoryItems.sku,
        totalQuantity: sql`SUM(${purchaseItems.quantity})`,
        totalRevenue: sql`SUM(CAST(${purchaseItems.totalPrice} AS DECIMAL))`,
        averagePrice: sql`AVG(CAST(${purchaseItems.unitPrice} AS DECIMAL))`,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .innerJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .where(and(gte(purchases.purchaseDate, startDate), eq(purchases.isDraft, false)))
      .groupBy(inventoryItems.id, inventoryItems.name, inventoryItems.sku)
      .orderBy(sql`SUM(${purchaseItems.quantity})`.desc())
      .limit(limit)

    return {
      success: true,
      data: topProducts,
    }
  } catch (error) {
    console.error("Error fetching top selling products:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching top selling products",
    }
  }
}

// Get sales by currency
export async function getSalesByCurrency(period: "week" | "month" | "year" = "month") {
  try {
    let startDate: Date
    const now = new Date()

    // Calculate start date based on period
    switch (period) {
      case "week":
        const day = now.getDay()
        startDate = new Date(now.setDate(now.getDate() - day))
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get sales by currency
    const salesByCurrency = await db
      .select({
        currency: purchases.currencyType,
        totalSales: sql`COUNT(*)`,
        totalAmount: sql`SUM(CAST(${purchases.totalAmount} AS DECIMAL))`,
      })
      .from(purchases)
      .where(and(gte(purchases.purchaseDate, startDate), eq(purchases.isDraft, false)))
      .groupBy(purchases.currencyType)

    return {
      success: true,
      data: salesByCurrency,
    }
  } catch (error) {
    console.error("Error fetching sales by currency:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching sales by currency",
    }
  }
}

