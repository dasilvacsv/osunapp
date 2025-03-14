'use server'

import { db } from "@/db"
import { 
  purchases,
  organizations,
  clients,
  beneficiarios,
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
      total: sql<number>`COALESCE(SUM(${purchases.totalAmount})::float, 0)`.as('total_revenue'),
      previousTotal: sql<number>`
        COALESCE(SUM(CASE 
          WHEN ${purchases.purchaseDate} < NOW() - INTERVAL '30 days'
          AND ${purchases.purchaseDate} >= NOW() - INTERVAL '60 days'
          THEN ${purchases.totalAmount}::float
          ELSE 0
        END), 0)
      `.as('previous_revenue')
    })
    .from(purchases)
    .where(eq(purchases.status, 'COMPLETED'))

  // Get counts with status tracking
  const [organizationsCount, clientsCount, childrenCount] = await Promise.all([
    db.select({ count: count() }).from(organizations).where(eq(organizations.status, 'ACTIVE')),
    db.select({ count: count() }).from(clients).where(eq(clients.status, 'ACTIVE')),
    db.select({ count: count() }).from(beneficiarios).where(eq(beneficiarios.status, 'ACTIVE'))
  ])

  // Get recent purchases with more details
  const recentPurchases = await db
    .select({
      id: purchases.id,
      totalAmount: sql<number>`${purchases.totalAmount}::float`,
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
      totalQuantity: sql<number>`COALESCE(sum(${purchaseItems.quantity}), 0)::int`,
      totalRevenue: sql<number>`COALESCE(sum(${purchaseItems.totalPrice}), 0)::float`,
      averagePrice: sql<number>`COALESCE(avg(${purchaseItems.unitPrice}), 0)::float`,
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
      totalRevenue: sql<number>`COALESCE(sum(${purchases.totalAmount}), 0)::float`.as('total_revenue'),
      activeClients: count(clients.id).as('active_clients')
    })
    .from(organizations)
    .leftJoin(purchases, eq(organizations.id, purchases.organizationId))
    .leftJoin(clients, eq(organizations.id, clients.organizationId))
    .where(eq(organizations.status, 'ACTIVE'))
    .groupBy(organizations.id, organizations.name, organizations.type)
    .orderBy(desc(sql`COALESCE(sum(${purchases.totalAmount}), 0)`))
    .limit(5)

  // Get revenue over time (daily for last 30 days)
  const revenueOverTime = await db
    .select({
      date: sql<string>`DATE(${purchases.purchaseDate})::text`,
      revenue: sql<number>`COALESCE(sum(${purchases.totalAmount}), 0)::float`.as('daily_revenue')
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
        total: sql<number>`COALESCE(sum(${payments.amount}), 0)::float`.as('total_paid')
      })
      .from(payments)
      .where(eq(payments.status, 'PAID')),

    // Get total pending amount
    db
      .select({
        total: sql<number>`COALESCE(sum(${payments.amount}), 0)::float`.as('total_pending')
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
    .orderBy(sql`${inventoryItems.currentStock}::float / NULLIF(${inventoryItems.minimumStock}::float, 0)`)

  // Get sales trends
  const [dailyTrends, monthlyTrends] = await Promise.all([
    // Daily trends
    db
      .select({
        date: sql<string>`DATE(${purchases.purchaseDate})::text`,
        revenue: sql<number>`COALESCE(sum(${purchases.totalAmount}), 0)::float`.as('revenue')
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
        revenue: sql<number>`COALESCE(sum(${purchases.totalAmount}), 0)::float`.as('revenue')
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