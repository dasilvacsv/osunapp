"use server"

import { db } from "@/db"
import {
  purchases,
  purchaseItems,
  inventoryItems,
  inventoryTransactions,
  clients,
  bundles,
  bundleItems,
  beneficiarios,
  organizations,
  payments,
  paymentPlans,
  saleTypeEnum,
} from "@/db/schema"
import { and, eq, sql, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { formatCurrency } from "@/lib/utils"
import * as XLSX from "xlsx"
import { writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"


export async function getSalesData2() {
  try {
    // Enhanced query to include more information from the updated schema
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
      .orderBy(sql`${purchases.purchaseDate} DESC`)

    // For each sale, fetch related payment plans and purchase items
    const enhancedSales = await Promise.all(
      sales.map(async (sale) => {
        // Get payment plans for this purchase
        const relatedPaymentPlans = await db
          .select()
          .from(paymentPlans)
          .where(eq(paymentPlans.purchaseId, sale.id));

        // Get payments for this purchase
        const relatedPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.purchaseId, sale.id));

        // Get purchase items with inventory item details
        const relatedItems = await db
          .select({
            purchaseItem: purchaseItems,
            inventoryItem: inventoryItems,
          })
          .from(purchaseItems)
          .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
          .where(eq(purchaseItems.purchaseId, sale.id));

        return {
          ...sale,
          paymentPlans: relatedPaymentPlans,
          payments: relatedPayments,
          items: relatedItems,
        };
      })
    );

    return {
      success: true,
      data: enhancedSales,
    }
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return { success: false, error: "Failed to fetch sales data" }
  }
}


