"use server"

import { db } from "@/db"
import { payments, purchases, clients } from "@/db/schema"
import { and, eq, gte, lte } from "drizzle-orm"
import { unstable_noStore as noStore } from "next/cache"

// Get payments for a specific date range with sale details
export async function getPaymentsForDateRange(startDate: Date, endDate: Date) {
  try {
    noStore()

    // Get payments for the specified date range with sale and client info
    const paymentsData = await db
      .select({
        payment: payments,
        sale: {
          id: purchases.id,
          clientId: purchases.clientId,
          totalAmount: purchases.totalAmount,
          currencyType: purchases.currencyType,
          conversionRate: purchases.conversionRate,
          client: clients,
        },
      })
      .from(payments)
      .leftJoin(purchases, eq(payments.purchaseId, purchases.id))
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .where(and(gte(payments.paymentDate, startDate), lte(payments.paymentDate, endDate), eq(payments.status, "PAID")))
      .orderBy(payments.paymentDate)

    // Format the response
    const formattedPayments = paymentsData.map(({ payment, sale }) => ({
      ...payment,
      sale: sale,
    }))

    return {
      success: true,
      data: formattedPayments,
    }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return {
      success: false,
      error: "Failed to fetch payments",
    }
  }
}

// Get sales summary for a specific date
export async function getSalesSummaryForDate(date: Date) {
  try {
    noStore()

    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split("T")[0]
    const startDate = new Date(`${formattedDate}T00:00:00.000Z`)
    const endDate = new Date(`${formattedDate}T23:59:59.999Z`)

    // Get sales summary
    const salesSummary = await db
      .select({
        count: db.count(),
        totalUSD: db.sum(
          db.sql`CASE WHEN ${purchases.currencyType} = 'USD' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) / CAST(${purchases.conversionRate} AS DECIMAL) END`,
        ),
        totalBS: db.sum(
          db.sql`CASE WHEN ${purchases.currencyType} = 'BS' THEN CAST(${purchases.totalAmount} AS DECIMAL) ELSE CAST(${purchases.totalAmount} AS DECIMAL) * CAST(COALESCE(${purchases.conversionRate}, '1') AS DECIMAL) END`,
        ),
        total: db.sum(db.sql`CAST(${purchases.totalAmount} AS DECIMAL)`),
      })
      .from(purchases)
      .where(
        and(
          gte(purchases.purchaseDate, startDate),
          lte(purchases.purchaseDate, endDate),
          eq(purchases.isDraft, false),
          eq(db.sql`(${purchases.paymentMetadata}->>'saleType')::text`, "DIRECT"),
        ),
      )

    // Get payments summary
    const paymentsSummary = await db
      .select({
        count: db.count(),
        totalUSD: db.sum(
          db.sql`CASE WHEN ${payments.currencyType} = 'USD' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) / CAST(${payments.conversionRate} AS DECIMAL) END`,
        ),
        totalBS: db.sum(
          db.sql`CASE WHEN ${payments.currencyType} = 'BS' THEN CAST(${payments.amount} AS DECIMAL) ELSE CAST(${payments.amount} AS DECIMAL) * CAST(COALESCE(${payments.conversionRate}, '1') AS DECIMAL) END`,
        ),
        total: db.sum(db.sql`CAST(${payments.amount} AS DECIMAL)`),
      })
      .from(payments)
      .where(and(gte(payments.paymentDate, startDate), lte(payments.paymentDate, endDate), eq(payments.status, "PAID")))

    // Get payments details
    const paymentsResult = await getPaymentsForDateRange(startDate, endDate)

    return {
      success: true,
      data: {
        directSales: {
          count: salesSummary[0]?.count || 0,
          totalUSD: Number(salesSummary[0]?.totalUSD || 0),
          totalBS: Number(salesSummary[0]?.totalBS || 0),
          total: Number(salesSummary[0]?.total || 0),
        },
        payments: {
          count: paymentsSummary[0]?.count || 0,
          totalUSD: Number(paymentsSummary[0]?.totalUSD || 0),
          totalBS: Number(paymentsSummary[0]?.totalBS || 0),
          total: Number(paymentsSummary[0]?.total || 0),
        },
        paymentsList: paymentsResult.success ? paymentsResult.data : [],
      },
    }
  } catch (error) {
    console.error("Error generating sales summary:", error)
    return {
      success: false,
      error: "Failed to generate sales summary",
    }
  }
}

