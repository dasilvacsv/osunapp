"use server"

import { db } from "@/db"
import { purchases, payments } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function getRemainingBalance(purchaseId: string) {
  try {
    // Get purchase details
    const [purchase] = await db
      .select({
        id: purchases.id,
        totalAmount: purchases.totalAmount,
        currencyType: purchases.currencyType,
        conversionRate: purchases.conversionRate,
      })
      .from(purchases)
      .where(eq(purchases.id, purchaseId))

    if (!purchase) {
      return { success: false, error: "Purchase not found" }
    }

    // Get total paid amount
    const [totalPaid] = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(eq(payments.purchaseId, purchaseId), eq(payments.status, "PAID"))

    // Calculate remaining amount
    const totalAmount = Number.parseFloat(purchase.totalAmount)
    const paidAmount = totalPaid.total || 0
    const remainingAmount = totalAmount - paidAmount

    return {
      success: true,
      data: {
        purchaseId,
        totalAmount,
        totalPaid: paidAmount,
        remainingAmount,
        currencyType: purchase.currencyType || "USD",
        conversionRate: Number.parseFloat(purchase.conversionRate || "1"),
      },
    }
  } catch (error) {
    console.error("Error getting remaining balance:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error getting remaining balance",
    }
  }
}

