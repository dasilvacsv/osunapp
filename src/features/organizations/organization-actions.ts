"use server"

import { db } from "@/db"
import { and, eq, sql, desc, gte } from "drizzle-orm"
import { organizations, purchases, purchaseItems, inventoryItems, clients } from "@/db/schema"

export async function getOrganizationMetrics(organizationId: string) {
  try {
    // Get date for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get monthly sales data
    const monthlySales = await db
      .select({
        month: sql`date_trunc('month', ${purchases.purchaseDate})::date`,
        sales: sql`SUM(${purchases.totalAmount}::numeric)::text`,
        count: sql`COUNT(*)::integer`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.organizationId, organizationId),
          gte(purchases.purchaseDate, sixMonthsAgo),
          eq(purchases.status, "COMPLETED")
        )
      )
      .groupBy(sql`date_trunc('month', ${purchases.purchaseDate})`)
      .orderBy(sql`date_trunc('month', ${purchases.purchaseDate})`)

    // Get pending payments
    const [pendingPayments] = await db
      .select({
        total: sql`COALESCE(SUM(${purchases.totalAmount}::numeric), 0)::text`,
        count: sql`COUNT(*)::integer`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.organizationId, organizationId),
          eq(purchases.status, "PENDING"),
          sql`NOT ${purchases.isPaid}`
        )
      )

    // Get total revenue
    const [revenue] = await db
      .select({
        total: sql`COALESCE(SUM(${purchases.totalAmount}::numeric), 0)::text`,
        count: sql`COUNT(*)::integer`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.organizationId, organizationId),
          eq(purchases.status, "COMPLETED")
        )
      )

    // Get active clients count
    const [activeClients] = await db
      .select({
        count: sql`COUNT(DISTINCT ${clients.id})::integer`,
      })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, organizationId),
          eq(clients.status, "ACTIVE")
        )
      )

    // Get top selling items
    const topItems = await db
      .select({
        itemId: purchaseItems.itemId,
        itemName: inventoryItems.name,
        totalQuantity: sql`SUM(${purchaseItems.quantity})::integer`,
        totalRevenue: sql`SUM(${purchaseItems.totalPrice}::numeric)::text`,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .innerJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .where(
        and(
          eq(purchases.organizationId, organizationId),
          eq(purchases.status, "COMPLETED")
        )
      )
      .groupBy(purchaseItems.itemId, inventoryItems.name)
      .orderBy(desc(sql`SUM(${purchaseItems.quantity})`))
      .limit(5)

    // Get recent activity
    const recentActivity = await db
      .select({
        id: purchases.id,
        date: purchases.purchaseDate,
        amount: purchases.totalAmount,
        status: purchases.status,
        clientName: clients.name,
      })
      .from(purchases)
      .innerJoin(clients, eq(purchases.clientId, clients.id))
      .where(eq(purchases.organizationId, organizationId))
      .orderBy(desc(purchases.purchaseDate))
      .limit(5)

    // Calculate growth rates
    const previousMonthSales = monthlySales[monthlySales.length - 2]?.sales || "0"
    const currentMonthSales = monthlySales[monthlySales.length - 1]?.sales || "0"
    const growthRate = ((Number(currentMonthSales) - Number(previousMonthSales)) / Number(previousMonthSales)) * 100

    return {
      success: true,
      data: {
        monthlySales: monthlySales.map(ms => ({
          month: new Date(ms.month).toLocaleString('default', { month: 'short' }),
          sales: Number(ms.sales),
          count: ms.count
        })),
        pendingPayments: {
          total: Number(pendingPayments.total),
          count: pendingPayments.count
        },
        revenue: {
          total: Number(revenue.total),
          count: revenue.count
        },
        activeClients: activeClients.count,
        topItems,
        recentActivity,
        growthRate: isFinite(growthRate) ? growthRate : 0
      }
    }
  } catch (error) {
    console.error("Error fetching organization metrics:", error)
    return { success: false, error: "Failed to fetch organization metrics" }
  }
}