"use server"

import { db } from "@/db"
import {
  clients,
  organizations,
  inventoryItems,
  bundles,
  bundleItems,
  beneficiarios,
  purchases,
  purchaseItems,
  payments,
  organizationMembers,
} from "@/db/schema"
import { eq, and, or, isNull, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Define types for our nested data structures
type OrganizationMembership = {
  membership: typeof organizationMembers.$inferSelect;
  organization: typeof organizations.$inferSelect;
}

type PurchaseWithDetails = {
  purchase: typeof purchases.$inferSelect;
  items: {
    item: typeof purchaseItems.$inferSelect;
    inventoryItem: typeof inventoryItems.$inferSelect;
  }[];
  bundle?: typeof bundles.$inferSelect;
}

// Get all clients with related data
export async function getClients() {
  try {
    // Get all active clients
    const clientsData = await db.select().from(clients).where(eq(clients.status, "ACTIVE"))
    
    if (clientsData.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const clientIds = clientsData.map(client => client.id)
    
    // Get organizations for these clients
    const organizationIds = clientsData
      .filter(c => c.organizationId)
      .map(c => c.organizationId as string)
    
    const organizationsData = organizationIds.length > 0
      ? await db.select().from(organizations)
          .where(inArray(organizations.id, organizationIds))
      : []
    
    // Get beneficiaries for these clients
    const beneficiariesData = await db.select().from(beneficiarios)
      .where(inArray(beneficiarios.clientId, clientIds))
    
    // Map organizations and beneficiaries to clients
    const result = clientsData.map(client => {
      const organization = client.organizationId
        ? organizationsData.find(org => org.id === client.organizationId)
        : undefined
      
      const clientBeneficiaries = beneficiariesData.filter(ben => ben.clientId === client.id)
      
      return {
        ...client,
        organization,
        beneficiaries: clientBeneficiaries,
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching clients:", error)
    return {
      success: false,
      error: "Failed to fetch clients",
    }
  }
}

// Get detailed client information
export async function getClientDetail(clientId: string) {
  try {
    // Get client
    const clientResult = await db.select().from(clients)
      .where(eq(clients.id, clientId))
    
    if (!clientResult || clientResult.length === 0) {
      return {
        success: false,
        error: "Client not found",
      }
    }
    
    const client = clientResult[0]
    
    // Get organization if it exists
    let organization: typeof organizations.$inferSelect | undefined
    if (client.organizationId) {
      const orgResult = await db.select().from(organizations)
        .where(eq(organizations.id, client.organizationId))
      organization = orgResult.length > 0 ? orgResult[0] : undefined
    }
    
    // Get beneficiaries
    const beneficiariesData = await db.select().from(beneficiarios)
      .where(eq(beneficiarios.clientId, clientId))
    
    // Get organization memberships
    const memberships = await db.select().from(organizationMembers)
      .where(eq(organizationMembers.clientId, clientId))
    
    let organizationMemberships: OrganizationMembership[] = []
    if (memberships.length > 0) {
      const membershipOrgIds = memberships.map(m => m.organizationId)
      const membershipOrgs = await db.select().from(organizations)
        .where(inArray(organizations.id, membershipOrgIds))
      
      organizationMemberships = memberships.map(membership => {
        const org = membershipOrgs.find(o => o.id === membership.organizationId)
        return org ? { membership, organization: org } : null
      }).filter((item): item is OrganizationMembership => item !== null)
    }
    
    // Get purchases with items and bundles
    const purchasesData = await db.select().from(purchases)
      .where(eq(purchases.clientId, clientId))
    
    let clientPurchases: PurchaseWithDetails[] = []
    if (purchasesData.length > 0) {
      const purchaseIds = purchasesData.map(p => p.id)
      const bundleIds = purchasesData
        .filter(p => p.bundleId)
        .map(p => p.bundleId as string)
      
      // Get bundles
      const bundlesData = bundleIds.length > 0
        ? await db.select().from(bundles).where(inArray(bundles.id, bundleIds))
        : []
      
      // Get purchase items with inventory items
      const purchaseItemsData = await db.select().from(purchaseItems)
        .where(inArray(purchaseItems.purchaseId, purchaseIds))
      
      const inventoryItemIds = purchaseItemsData.map(pi => pi.itemId)
      const inventoryItemsData = await db.select().from(inventoryItems)
        .where(inArray(inventoryItems.id, inventoryItemIds))
      
      clientPurchases = purchasesData.map(purchase => {
        const bundle = purchase.bundleId
          ? bundlesData.find(b => b.id === purchase.bundleId)
          : undefined
        
        const items = purchaseItemsData
          .filter(pi => pi.purchaseId === purchase.id)
          .map(item => {
            const inventoryItem = inventoryItemsData.find(ii => ii.id === item.itemId)
            return inventoryItem ? { item, inventoryItem } : null
          })
          .filter((item): item is { item: typeof purchaseItems.$inferSelect; inventoryItem: typeof inventoryItems.$inferSelect } => item !== null)
        
        return {
          purchase,
          items,
          bundle,
        }
      })
    }

    return {
      success: true,
      data: {
        client,
        organization,
        children: beneficiariesData,
        organizationMemberships,
        purchases: clientPurchases,
      },
    }
  } catch (error) {
    console.error("Error fetching client detail:", error)
    return {
      success: false,
      error: "Failed to fetch client detail",
    }
  }
}

export async function getOrganizations() {
  try {
    const result = await db.select().from(organizations).where(eq(organizations.status, "ACTIVE"))

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return {
      success: false,
      error: "Failed to fetch organizations",
    }
  }
}

export async function getProducts() {
  try {
    const result = await db
      .select()
      .from(inventoryItems)
      .where(
        and(eq(inventoryItems.status, "ACTIVE"), or(isNull(inventoryItems.type), eq(inventoryItems.type, "PHYSICAL"))),
      )

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return {
      success: false,
      error: "Failed to fetch products",
    }
  }
}

export async function getBundles() {
  try {
    const bundlesData = await db.select().from(bundles).where(eq(bundles.status, "ACTIVE"))

    const bundlesWithItems = await Promise.all(
      bundlesData.map(async (bundle) => {
        const items = await db
          .select({
            id: bundleItems.id,
            quantity: bundleItems.quantity,
            overridePrice: bundleItems.overridePrice,
            item: inventoryItems,
          })
          .from(bundleItems)
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
          .where(eq(bundleItems.bundleId, bundle.id))

        return {
          ...bundle,
          items,
        }
      }),
    )

    return {
      success: true,
      data: bundlesWithItems,
    }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return {
      success: false,
      error: "Failed to fetch bundles",
    }
  }
}

export async function createSale(data: any) {
  try {
    // Create the purchase first
    const [purchase] = await db
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
        vendido: data.vendido || false,
      })
      .returning()

    // Create purchase items if they exist
    if (data.items && data.items.length > 0) {
      const purchaseItemsData = data.items.map((item: any) => ({
        purchaseId: purchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        metadata: item.metadata || {},
      }))

      await db.insert(purchaseItems).values(purchaseItemsData)
    }

    // Create payment if the purchase is paid
    if (data.isPaid) {
      await db.insert(payments).values({
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

    revalidatePath("/sales")

    return {
      success: true,
      data: purchase,
    }
  } catch (error) {
    console.error("Error creating sale:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create sale",
    }
  }
}

export async function getBeneficiariesByClient(clientId: string) {
  try {
    const result = await db.select().from(beneficiarios).where(eq(beneficiarios.clientId, clientId))

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching beneficiaries:", error)
    return {
      success: false,
      error: "Failed to fetch beneficiaries",
    }
  }
}