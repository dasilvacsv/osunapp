'use server'

import { db } from "@/db"
import { 
  purchases,
  organizations,
  clients,
  children,
  inventoryItems,
  bundles,
  purchaseItems
} from "@/db/schema"
import { eq, and, count, sum, desc } from "drizzle-orm"
import { sql } from "drizzle-orm"

export type DashboardData = {
  totalRevenue: number;
  totalOrganizations: number;
  totalClients: number;
  totalChildren: number;
  recentPurchases: any[];
  topSellingItems: any[];
  organizationStats: any[];
  inventoryAlerts: any[];
}

export async function getDashboardData(): Promise<DashboardData> {
  // Get total revenue
  const revenueResult = await db
    .select({ 
      total: sum(purchases.totalAmount).as('total_revenue') 
    })
    .from(purchases)
    .where(eq(purchases.status, 'COMPLETED'));

  // Get count of active organizations
  const organizationsCount = await db
    .select({ 
      count: count().as('total') 
    })
    .from(organizations)
    .where(eq(organizations.status, 'ACTIVE'));

  // Get count of active clients
  const clientsCount = await db
    .select({ 
      count: count().as('total') 
    })
    .from(clients)
    .where(eq(clients.status, 'ACTIVE'));

  // Get count of active children
  const childrenCount = await db
    .select({ 
      count: count().as('total') 
    })
    .from(children)
    .where(eq(children.status, 'ACTIVE'));

  // Get recent purchases with related data
  const recentPurchases = await db
    .select({
      id: purchases.id,
      totalAmount: purchases.totalAmount,
      status: purchases.status,
      purchaseDate: purchases.purchaseDate,
      clientName: clients.name,
      organizationName: organizations.name,
    })
    .from(purchases)
    .innerJoin(clients, eq(purchases.clientId, clients.id))
    .innerJoin(organizations, eq(purchases.organizationId, organizations.id))
    .orderBy(desc(purchases.purchaseDate))
    .limit(5);

  // Get top selling items
  const topSellingItems = await db
    .select({
      itemId: purchaseItems.itemId,
      itemName: inventoryItems.name,
      totalQuantity: sql<number>`sum(${purchaseItems.quantity})::int`,
      totalRevenue: sql<number>`sum(${purchaseItems.totalPrice})::float`
    })
    .from(purchaseItems)
    .innerJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
    .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
    .where(eq(purchases.status, 'COMPLETED'))
    .groupBy(purchaseItems.itemId, inventoryItems.name)
    .orderBy(desc(sql`sum(${purchaseItems.quantity})`))
    .limit(5);

  // Get organization stats
  const organizationStats = await db
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      type: organizations.type,
      totalPurchases: count(purchases.id).as('total_purchases'),
      totalRevenue: sum(purchases.totalAmount).as('total_revenue')
    })
    .from(organizations)
    .leftJoin(purchases, eq(organizations.id, purchases.organizationId))
    .where(eq(organizations.status, 'ACTIVE'))
    .groupBy(organizations.id, organizations.name, organizations.type)
    .orderBy(desc(sum(purchases.totalAmount)))
    .limit(5);

  // Get inventory alerts (items below minimum stock)
  const inventoryAlerts = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      currentStock: inventoryItems.currentStock,
      minimumStock: inventoryItems.minimumStock,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.status, 'ACTIVE'),
        sql`${inventoryItems.currentStock} < ${inventoryItems.minimumStock}`
      )
    );

  return {
    totalRevenue: revenueResult[0]?.total || 0,
    totalOrganizations: organizationsCount[0]?.count || 0,
    totalClients: clientsCount[0]?.count || 0,
    totalChildren: childrenCount[0]?.count || 0,
    recentPurchases,
    topSellingItems,
    organizationStats,
    inventoryAlerts
  };
}