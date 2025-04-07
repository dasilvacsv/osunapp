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
  organizationMembers,
  inventoryTransactions,
} from "@/db/schema"
import { eq, and, or, isNull, inArray, sql, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getBCVRate } from "@/lib/exchangeRates"

// Define types for our nested data structures
type OrganizationMembership = {
  membership: typeof organizationMembers.$inferSelect
  organization: typeof organizations.$inferSelect
}

type PurchaseWithDetails = {
  purchase: typeof purchases.$inferSelect
  items: {
    item: typeof purchaseItems.$inferSelect
    inventoryItem: typeof inventoryItems.$inferSelect
  }[]
  bundle?: typeof bundles.$inferSelect
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

    const clientIds = clientsData.map((client) => client.id)

    // Get organizations for these clients
    const organizationIds = clientsData.filter((c) => c.organizationId).map((c) => c.organizationId as string)

    const organizationsData =
      organizationIds.length > 0
        ? await db.select().from(organizations).where(inArray(organizations.id, organizationIds))
        : []

    // Get beneficiaries for these clients
    const beneficiariesData = await db.select().from(beneficiarios).where(inArray(beneficiarios.clientId, clientIds))

    // Map organizations and beneficiaries to clients
    const result = clientsData.map((client) => {
      const organization = client.organizationId
        ? organizationsData.find((org) => org.id === client.organizationId)
        : undefined

      const clientBeneficiaries = beneficiariesData.filter((ben) => ben.clientId === client.id)

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
      error: "Error al obtener los clientes",
    }
  }
}

// Get detailed client information
export async function getClientDetail(clientId: string) {
  try {
    const clientResult = await db.select().from(clients).where(eq(clients.id, clientId))

    if (!clientResult.length) {
      return {
        success: false,
        data: null,
        error: "Cliente no encontrado",
      }
    }

    const client = clientResult[0]

    // Obtener organización
    let organization = null
    if (client.organizationId) {
      const orgResult = await db.select().from(organizations).where(eq(organizations.id, client.organizationId))
      organization = orgResult[0] || null
    }

    // Obtener beneficiarios
    const beneficiariesData = await db.select().from(beneficiarios).where(eq(beneficiarios.clientId, clientId))

    // Obtener membresías de organizaciones
    const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.clientId, clientId))

    let organizationMemberships = []
    if (memberships.length > 0) {
      const orgIds = memberships.map((m) => m.organizationId)
      const orgs = await db.select().from(organizations).where(inArray(organizations.id, orgIds))

      organizationMemberships = memberships
        .map((m) => ({
          membership: m,
          organization: orgs.find((o) => o.id === m.organizationId),
        }))
        .filter((m) => m.organization)
    }

    // Obtener compras
    const purchasesData = await db.select().from(purchases).where(eq(purchases.clientId, clientId))

    let clientPurchases = []
    if (purchasesData.length > 0) {
      const purchaseIds = purchasesData.map((p) => p.id)

      // Obtener items de compra
      const purchaseItemsData = await db
        .select()
        .from(purchaseItems)
        .where(inArray(purchaseItems.purchaseId, purchaseIds))

      // Obtener detalles de inventario
      const itemIds = purchaseItemsData.map((pi) => pi.itemId)
      const inventoryItemsData = await db.select().from(inventoryItems).where(inArray(inventoryItems.id, itemIds))

      clientPurchases = purchasesData.map((purchase) => {
        const items = purchaseItemsData
          .filter((pi) => pi.purchaseId === purchase.id)
          .map((pi) => ({
            item: pi,
            inventoryItem: inventoryItemsData.find((ii) => ii.id === pi.itemId),
          }))
          .filter((i) => i.inventoryItem)

        return {
          purchase,
          items: items.map((i) => ({
            ...i,
            inventoryItem: {
              ...i.inventoryItem,
              basePrice: Number(i.inventoryItem.basePrice),
            },
          })),
        }
      })
    }

    return {
      success: true,
      data: {
        ...client,
        organization,
        beneficiarios: beneficiariesData.map((b) => ({
          ...b,
          level: b.level || "",
          section: b.section || "",
        })),
        organizationMemberships,
        purchases: clientPurchases,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching client detail:", error)
    return {
      success: false,
      data: null,
      error: "Error al obtener los detalles del cliente",
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
      error: "Error al obtener las organizaciones",
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

    const processedProducts = result.map((item) => ({
      ...item,
      basePrice: Number(item.basePrice),
      currentStock: Number(item.currentStock),
      reservedStock: Number(item.reservedStock),
      minimumStock: Number(item.minimumStock),
      allowPresale: Boolean(item.allowPresale),
    }))

    return {
      success: true,
      data: processedProducts,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return {
      success: false,
      data: [],
      error: "Error al obtener los productos",
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
          basePrice: Number(bundle.basePrice),
          bundlePrice: bundle.bundlePrice ? Number(bundle.bundlePrice) : null,
          items: items.map((i) => ({
            ...i,
            overridePrice: i.overridePrice ? Number(i.overridePrice) : null,
            item: {
              ...i.item,
              basePrice: Number(i.item.basePrice),
              currentStock: Number(i.item.currentStock),
            },
          })),
        }
      }),
    )

    return {
      success: true,
      data: bundlesWithItems,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return {
      success: false,
      data: [],
      error: "Error al obtener los paquetes",
    }
  }
}

// Create a new sale
export async function createSale(data: {
  clientId: string
  items: Array<{
    itemId: string
    quantity: number
    overridePrice?: number
    metadata?: any
  }>
  bundleId?: string
  beneficiaryId?: string
  beneficiary?: {
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
  }
  paymentMethod: string
  saleType: "DIRECT" | "PRESALE"
  transactionReference?: string
  organizationId?: string | null
  isDraft?: boolean
  vendido?: boolean
  isDonation?: boolean
  currencyType?: string
  conversionRate?: number
}) {
  try {
    // Calculate the total price based on items
    let totalAmount = 0
    let bundleItems: any[] = []
    let isBundle = false

    // Check if we're dealing with a bundle
    if (data.bundleId && data.items.length > 0 && data.items[0].metadata?.isBundle) {
      isBundle = true
      // For bundles, use the override price directly as the bundle price
      totalAmount = data.items[0].quantity * (data.items[0].overridePrice || 0)

      // Store the bundle items for later processing
      if (data.items[0].metadata?.bundleItems) {
        bundleItems = data.items[0].metadata.bundleItems
      }
    } else {
      // Calculate total from regular items
      for (const item of data.items) {
        const inventoryItem = await db
          .select({ basePrice: inventoryItems.basePrice })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, item.itemId))
          .limit(1)

        if (!inventoryItem.length) {
          throw new Error(`Producto no encontrado: ${item.itemId}`)
        }

        const price = item.overridePrice || Number(inventoryItem[0].basePrice)
        totalAmount += price * item.quantity
      }
    }

    // If this is a bundle sale, check if the bundle has a specific currency type
    let currencyType = data.currencyType || "USD"
    let conversionRate = data.conversionRate || 1

    if (data.bundleId) {
      const bundleResult = await db
        .select({
          currencyType: bundles.currencyType,
          conversionRate: bundles.conversionRate,
        })
        .from(bundles)
        .where(eq(bundles.id, data.bundleId))
        .limit(1)

      if (bundleResult.length > 0) {
        // If the bundle has a currency type, use it
        if (bundleResult[0].currencyType) {
          currencyType = bundleResult[0].currencyType

          // If the bundle has a conversion rate, use it
          if (bundleResult[0].conversionRate) {
            conversionRate = Number(bundleResult[0].conversionRate)
          } else if (currencyType === "BS") {
            // If no conversion rate but currency is BS, get BCV rate
            try {
              const rateInfo = await getBCVRate()
              conversionRate = rateInfo.rate
            } catch (error) {
              console.error("Error getting BCV rate:", error)
              // Default to 35 if BCV rate fetch fails
              conversionRate = 35
            }
          }
        }
      }
    }

    // Insert the purchase
    const [purchase] = await db
      .insert(purchases)
      .values({
        clientId: data.clientId,
        beneficiarioId: data.beneficiaryId,
        bundleId: data.bundleId,
        status: "PENDING",
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: "PAID",
        isPaid: true,
        organizationId: data.organizationId === "none" ? null : data.organizationId,
        transactionReference: data.transactionReference,
        bookingMethod: data.saleType,
        // Store saleType in paymentMetadata
        paymentMetadata: {
          saleType: data.saleType,
          isBundle: isBundle,
        },
        // Add new fields
        isDraft: data.isDraft || false,
        vendido: data.vendido || false,
        isDonation: data.isDonation || false,
        currencyType: currencyType,
        conversionRate: conversionRate.toString(),
      })
      .returning()

    if (!purchase) {
      throw new Error("Error al crear el registro de venta")
    }

    // Process each item individually
    if (isBundle) {
      // For bundles, first insert the main bundle item
      const mainItem = data.items[0]
      await db.insert(purchaseItems).values({
        purchaseId: purchase.id,
        itemId: mainItem.itemId,
        quantity: mainItem.quantity,
        unitPrice: (mainItem.overridePrice || 0).toString(),
        totalPrice: (mainItem.quantity * (mainItem.overridePrice || 0)).toString(),
        metadata: {
          isBundle: true,
          bundleId: data.bundleId,
          bundleName: mainItem.metadata?.bundleName || "Bundle",
        },
      })

      // Then insert all bundle items with the bundle metadata
      for (const bundleItem of bundleItems) {
        const inventoryItem = await db
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.id, bundleItem.itemId))
          .limit(1)

        if (!inventoryItem.length) {
          console.warn(`Bundle item not found: ${bundleItem.itemId}`)
          continue
        }

        // Insert each bundle item with metadata linking it to the bundle
        await db.insert(purchaseItems).values({
          purchaseId: purchase.id,
          itemId: bundleItem.itemId,
          quantity: bundleItem.quantity,
          unitPrice: bundleItem.price.toString(),
          totalPrice: (bundleItem.quantity * bundleItem.price).toString(),
          metadata: {
            bundleId: data.bundleId,
            bundleName: mainItem.metadata?.bundleName || "Bundle",
            isPartOfBundle: true,
          },
        })

        // Update inventory for bundle items if not a draft
        if (!data.isDraft && data.saleType !== "PRESALE") {
          // Decrease stock
          await db
            .update(inventoryItems)
            .set({
              currentStock: sql`${inventoryItems.currentStock} - ${bundleItem.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, bundleItem.itemId))

          // Record transaction
          await db.insert(inventoryTransactions).values({
            itemId: bundleItem.itemId,
            quantity: -bundleItem.quantity,
            transactionType: "OUT",
            reference: { purchaseId: purchase.id, bundleId: data.bundleId },
            notes: `Venta de Bundle #${purchase.id}`,
          })
        } else if (!data.isDraft && data.saleType === "PRESALE") {
          // For presales, reserve the stock
          await db
            .update(inventoryItems)
            .set({
              reservedStock: sql`COALESCE(${inventoryItems.reservedStock}, 0) + ${bundleItem.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, bundleItem.itemId))

          // Record reservation transaction
          await db.insert(inventoryTransactions).values({
            itemId: bundleItem.itemId,
            quantity: -bundleItem.quantity,
            transactionType: "RESERVATION",
            reference: { purchaseId: purchase.id, bundleId: data.bundleId },
            notes: `Pre-venta de Bundle #${purchase.id}`,
          })
        }
      }
    } else {
      // Process regular items
      for (const item of data.items) {
        const inventoryItem = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId)).limit(1)

        if (!inventoryItem.length) {
          throw new Error(`Producto no encontrado: ${item.itemId}`)
        }

        const price = item.overridePrice || Number(inventoryItem[0].basePrice)

        // Insert purchase item
        await db.insert(purchaseItems).values({
          purchaseId: purchase.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: price.toString(),
          totalPrice: (price * item.quantity).toString(),
          metadata: item.metadata || {},
        })

        // If not a draft and not a presale, update inventory immediately
        if (!data.isDraft && data.saleType !== "PRESALE") {
          // Decrease stock
          await db
            .update(inventoryItems)
            .set({
              currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.itemId))

          // Record transaction
          await db.insert(inventoryTransactions).values({
            itemId: item.itemId,
            quantity: -item.quantity,
            transactionType: "OUT",
            reference: { purchaseId: purchase.id },
            notes: `Venta #${purchase.id}`,
          })
        } else if (!data.isDraft && data.saleType === "PRESALE") {
          // For presales, reserve the stock
          await db
            .update(inventoryItems)
            .set({
              reservedStock: sql`COALESCE(${inventoryItems.reservedStock}, 0) + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.itemId))

          // Record reservation transaction
          await db.insert(inventoryTransactions).values({
            itemId: item.itemId,
            quantity: -item.quantity,
            transactionType: "RESERVATION",
            reference: { purchaseId: purchase.id },
            notes: `Pre-venta #${purchase.id}`,
          })
        }
        // For drafts, don't update inventory
      }
    }

    // Rest of the function remains the same...
    // If this sale is for a bundle and doesn't have a beneficiaryId but has beneficiary details, create a beneficiary
    if (data.bundleId && !data.beneficiaryId && data.beneficiary) {
      const fullName = `${data.beneficiary.firstName} ${data.beneficiary.lastName}`

      // Create a new beneficiary
      const [newBeneficiary] = await db
        .insert(beneficiarios)
        .values({
          name: fullName,
          clientId: data.clientId,
          firstName: data.beneficiary.firstName,
          lastName: data.beneficiary.lastName,
          school: data.beneficiary.school,
          level: data.beneficiary.level,
          section: data.beneficiary.section,
          bundleId: data.bundleId,
          organizationId: data.organizationId === "none" ? null : data.organizationId,
          status: "ACTIVE",
        })
        .returning()

      if (newBeneficiary) {
        // Update the purchase with the beneficiary ID
        await db.update(purchases).set({ beneficiarioId: newBeneficiary.id }).where(eq(purchases.id, purchase.id))
      }
    }

    // Update bundle stats if this is a bundle purchase and not a draft
    if (data.bundleId && !data.isDraft) {
      await db
        .update(bundles)
        .set({
          totalSales: sql`COALESCE(${bundles.totalSales}, 0) + 1`,
          lastSaleDate: new Date(),
          totalRevenue: sql`COALESCE(${bundles.totalRevenue}, 0) + ${totalAmount}`,
        })
        .where(eq(bundles.id, data.bundleId))
    }

    // Get the full purchase details with relations for the response
    const purchaseDetails = await db
      .select({
        purchase: purchases,
        client: clients,
        beneficiary: beneficiarios,
        organization: organizations,
        bundle: bundles,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .where(eq(purchases.id, purchase.id))
      .limit(1)

    if (!purchaseDetails.length) {
      throw new Error("Error al recuperar detalles de la venta")
    }

    // Get purchase items
    const items = await db
      .select({
        item: purchaseItems,
        inventoryItem: inventoryItems,
      })
      .from(purchaseItems)
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .where(eq(purchaseItems.purchaseId, purchase.id))

    // Revalidate paths
    revalidatePath("/sales")
    revalidatePath("/inventory")

    return {
      success: true,
      data: {
        ...purchaseDetails[0],
        items,
        saleType: data.saleType,
      },
    }
  } catch (error) {
    console.error("Error al crear venta:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function getBeneficiariesByClient(clientId: string) {
  try {
    const result = await db
      .select()
      .from(beneficiarios)
      .where(and(eq(beneficiarios.clientId, clientId), eq(beneficiarios.status, "ACTIVE")))
      .orderBy(desc(beneficiarios.createdAt))

    return {
      success: true,
      data: result.map((b) => ({
        id: b.id,
        clientId: b.clientId,
        organizationId: b.organizationId || null,
        grade: b.grade || null,
        section: b.section || null,
        status: b.status || "ACTIVE",
        bundleId: b.bundleId || null,
        firstName: b.firstName || null,
        lastName: b.lastName || null,
        school: b.school || null,
        level: b.level || null,
        createdAt: b.createdAt || null,
        updatedAt: b.updatedAt || null,
      })),
    }
  } catch (error) {
    console.error("Error fetching beneficiaries:", error)
    return {
      success: false,
      error: "Error al obtener los beneficiarios",
    }
  }
}

// Get current BCV rate
export async function getCurrentBCVRate() {
  try {
    const rateInfo = await getBCVRate()

    return {
      success: true,
      data: {
        rate: rateInfo.rate,
        lastUpdate: rateInfo.lastUpdate,
        isError: rateInfo.isError,
      },
    }
  } catch (error) {
    console.error("Error fetching BCV rate:", error)
    return {
      success: false,
      error: "Error al obtener la tasa BCV",
    }
  }
}

// Search for bundles with currency filtering
export async function searchBundlesWithCurrency(query: string, currencyType?: string) {
  try {
    // Base query
    let bundlesQuery = db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
        currencyType: bundles.currencyType,
        conversionRate: bundles.conversionRate,
      })
      .from(bundles)
      .where(and(eq(bundles.status, "ACTIVE"), sql`LOWER(${bundles.name}) LIKE ${"%" + query.toLowerCase() + "%"}`))

    // Add currency filter if specified
    if (currencyType) {
      bundlesQuery = bundlesQuery.where(sql`COALESCE(${bundles.currencyType}, 'USD') = ${currencyType}`)
    }

    const bundlesResult = await bundlesQuery.limit(10)

    // Para cada bundle, obtenemos sus items
    const bundlesWithItems = await Promise.all(
      bundlesResult.map(async (bundle) => {
        const bundleItemsResult = await db
          .select({
            id: bundleItems.id,
            quantity: bundleItems.quantity,
            overridePrice: bundleItems.overridePrice,
            item: {
              id: inventoryItems.id,
              name: inventoryItems.name,
              currentStock: inventoryItems.currentStock,
              basePrice: inventoryItems.basePrice,
              metadata: inventoryItems.metadata,
              allowPresale: inventoryItems.allowPresale,
            },
          })
          .from(bundleItems)
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
          .where(eq(bundleItems.bundleId, bundle.id))

        // Procesar los resultados para extraer allowPreSale de metadata
        const processedItems = bundleItemsResult.map((item) => {
          return {
            ...item,
            item: {
              ...item.item,
              allowPreSale: item.item.allowPresale || false,
            },
          }
        })

        return {
          ...bundle,
          items: processedItems,
        }
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error al buscar paquetes:", error)
    return { success: false, error: "Error al buscar paquetes" }
  }
}

