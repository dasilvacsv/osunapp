'use server'

import { db } from "@/db"
import { 
  purchases,
  organizations,
  clients,
  children,
  inventoryItems,
  purchaseItems,
  payments
} from "@/db/schema"
import { eq, and, count, sum, desc, sql, between } from "drizzle-orm"

export type DashboardData = {
  totalRevenue: number
  totalOrganizations: number
  totalClients: number
  totalChildren: number
  recentPurchases: any[]
  topSellingItems: any[]
  organizationStats: any[]
  revenueOverTime: any[]
  paymentStats: {
    totalPaid: number
    totalPending: number
    paymentMethods: { method: string; count: number }[]
  }
  inventoryAlerts: any[]
  salesTrends: {
    daily: { date: string; revenue: number }[]
    monthly: { month: string; revenue: number }[]
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  // Get date ranges for trends
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Get total revenue with comparison
  const revenueResult = await db
    .select({ 
      total: sum(purchases.totalAmount).as('total_revenue'),
      previousTotal: sql<number>`
        SUM(CASE 
          WHEN ${purchases.purchaseDate} < NOW() - INTERVAL '30 days'
          AND ${purchases.purchaseDate} >= NOW() - INTERVAL '60 days'
          THEN ${purchases.totalAmount}
          ELSE 0
        END)
      `.as('previous_revenue')
    })
    .from(purchases)
    .where(eq(purchases.status, 'COMPLETED'))

  // Get counts with status tracking
  const [organizationsCount, clientsCount, childrenCount] = await Promise.all([
    db.select({ count: count() }).from(organizations).where(eq(organizations.status, 'ACTIVE')),
    db.select({ count: count() }).from(clients).where(eq(clients.status, 'ACTIVE')),
    db.select({ count: count() }).from(children).where(eq(children.status, 'ACTIVE'))
  ])

  // Get recent purchases with more details
  const recentPurchases = await db
    .select({
      id: purchases.id,
      totalAmount: purchases.totalAmount,
      status: purchases.status,
      purchaseDate: purchases.purchaseDate,
      clientName: clients.name,
      organizationName: organizations.name,
      paymentStatus: purchases.paymentStatus,
      itemCount: count(purchaseItems.id).as('item_count')
    })
    .from(purchases)
    .innerJoin(clients, eq(purchases.clientId, clients.id))
    .innerJoin(organizations, eq(purchases.organizationId, organizations.id))
    .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
    .groupBy(
      purchases.id,
      purchases.totalAmount,
      purchases.status,
      purchases.purchaseDate,
      clients.name,
      organizations.name,
      purchases.paymentStatus
    )
    .orderBy(desc(purchases.purchaseDate))
    .limit(5)

  // Get top selling items with trend analysis
  const topSellingItems = await db
    .select({
      itemId: purchaseItems.itemId,
      itemName: inventoryItems.name,
      totalQuantity: sql<number>`sum(${purchaseItems.quantity})::int`,
      totalRevenue: sql<number>`sum(${purchaseItems.totalPrice})::float`,
      averagePrice: sql<number>`avg(${purchaseItems.unitPrice})::float`,
      currentStock: inventoryItems.currentStock
    })
    .from(purchaseItems)
    .innerJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
    .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
    .where(
      and(
        eq(purchases.status, 'COMPLETED'),
        between(purchases.purchaseDate, thirtyDaysAgo, now)
      )
    )
    .groupBy(purchaseItems.itemId, inventoryItems.name, inventoryItems.currentStock)
    .orderBy(desc(sql`sum(${purchaseItems.quantity})`))
    .limit(5)

  // Get organization performance stats
  const organizationStats = await db
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      type: organizations.type,
      totalPurchases: count(purchases.id).as('total_purchases'),
      totalRevenue: sum(purchases.totalAmount).as('total_revenue'),
      activeClients: count(clients.id).as('active_clients')
    })
    .from(organizations)
    .leftJoin(purchases, eq(organizations.id, purchases.organizationId))
    .leftJoin(clients, eq(organizations.id, clients.organizationId))
    .where(eq(organizations.status, 'ACTIVE'))
    .groupBy(organizations.id, organizations.name, organizations.type)
    .orderBy(desc(sum(purchases.totalAmount)))
    .limit(5)

  // Get revenue over time (daily for last 30 days)
  const revenueOverTime = await db
    .select({
      date: sql<string>`DATE(${purchases.purchaseDate})::text`,
      revenue: sum(purchases.totalAmount).as('daily_revenue')
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.status, 'COMPLETED'),
        between(purchases.purchaseDate, thirtyDaysAgo, now)
      )
    )
    .groupBy(sql`DATE(${purchases.purchaseDate})`)
    .orderBy(sql`DATE(${purchases.purchaseDate})`)

  // Get payment statistics (fixed to avoid nested aggregates)
  const [paidStats, pendingStats, methodStats] = await Promise.all([
    // Get total paid amount
    db
      .select({
        total: sum(payments.amount).as('total_paid')
      })
      .from(payments)
      .where(eq(payments.status, 'PAID')),

    // Get total pending amount
    db
      .select({
        total: sum(payments.amount).as('total_pending')
      })
      .from(payments)
      .where(eq(payments.status, 'PENDING')),

    // Get payment method statistics
    db
      .select({
        method: payments.paymentMethod,
        count: count().as('count')
      })
      .from(payments)
      .groupBy(payments.paymentMethod)
  ])

  // Get inventory alerts
  const inventoryAlerts = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      currentStock: inventoryItems.currentStock,
      minimumStock: inventoryItems.minimumStock,
      expectedRestock: inventoryItems.expectedRestock
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.status, 'ACTIVE'),
        sql`${inventoryItems.currentStock} < ${inventoryItems.minimumStock}`
      )
    )
    .orderBy(sql`${inventoryItems.currentStock} / ${inventoryItems.minimumStock}::float`)

  // Get sales trends
  const [dailyTrends, monthlyTrends] = await Promise.all([
    // Daily trends
    db
      .select({
        date: sql<string>`DATE(${purchases.purchaseDate})::text`,
        revenue: sum(purchases.totalAmount).as('revenue')
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'COMPLETED'),
          between(purchases.purchaseDate, thirtyDaysAgo, now)
        )
      )
      .groupBy(sql`DATE(${purchases.purchaseDate})`)
      .orderBy(sql`DATE(${purchases.purchaseDate})`),
    
    // Monthly trends
    db
      .select({
        month: sql<string>`TO_CHAR(${purchases.purchaseDate}, 'YYYY-MM')`,
        revenue: sum(purchases.totalAmount).as('revenue')
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'COMPLETED'),
          between(purchases.purchaseDate, startOfYear, now)
        )
      )
      .groupBy(sql`TO_CHAR(${purchases.purchaseDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${purchases.purchaseDate}, 'YYYY-MM')`)
  ])

  return {
    totalRevenue: revenueResult[0]?.total || 0,
    totalOrganizations: organizationsCount[0]?.count || 0,
    totalClients: clientsCount[0]?.count || 0,
    totalChildren: childrenCount[0]?.count || 0,
    recentPurchases,
    topSellingItems,
    organizationStats,
    revenueOverTime,
    paymentStats: {
      totalPaid: paidStats[0]?.total || 0,
      totalPending: pendingStats[0]?.total || 0,
      paymentMethods: methodStats.map(stat => ({
        method: stat.method || 'Unknown',
        count: stat.count
      }))
    },
    inventoryAlerts,
    salesTrends: {
      daily: dailyTrends,
      monthly: monthlyTrends
    }
  }
}