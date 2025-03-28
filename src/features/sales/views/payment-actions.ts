"use server"

import { db } from "@/db"
import { payments, paymentPlans, purchases } from "@/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type InstallmentFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY"
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"

export async function createPaymentPlan({
  purchaseId,
  totalAmount,
  downPayment = 0,
  installmentCount,
  installmentFrequency = "MONTHLY",
  startDate,
}: {
  purchaseId: string
  totalAmount: number
  downPayment?: number
  installmentCount: number
  installmentFrequency?: InstallmentFrequency
  startDate: Date
}) {
  try {
    // Validar que la compra existe
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId))
    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Crear el plan de pago
    const [paymentPlan] = await db
      .insert(paymentPlans)
      .values({
        purchaseId,
        totalAmount: totalAmount.toString(),
        downPayment: downPayment ? downPayment.toString() : null,
        installmentCount,
        installmentFrequency,
        startDate,
        status: "ACTIVE",
      })
      .returning()

    // Actualizar la compra para indicar que tiene un plan de pago
    await db
      .update(purchases)
      .set({
        paymentType: "INSTALLMENT",
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchaseId))

    // Generar los pagos a plazos
    const installmentAmount = (totalAmount - downPayment) / installmentCount
    const installments = []

    // Si hay un pago inicial, crearlo primero
    if (downPayment > 0) {
      const [downPaymentRecord] = await db
        .insert(payments)
        .values({
          purchaseId,
          amount: downPayment.toString(),
          status: "PENDING",
          dueDate: startDate,
          notes: "Pago inicial",
          currencyType: purchase.currencyType || "USD",
          conversionRate: purchase.conversionRate || "1",
        })
        .returning()

      installments.push(downPaymentRecord)
    }

    // Generar las fechas de vencimiento según la frecuencia
    const dueDates = generateDueDates(startDate, installmentCount, installmentFrequency)

    // Crear los pagos a plazos
    for (let i = 0; i < installmentCount; i++) {
      const [installment] = await db
        .insert(payments)
        .values({
          purchaseId,
          amount: installmentAmount.toFixed(2),
          status: "PENDING",
          dueDate: dueDates[i],
          notes: `Cuota ${i + 1} de ${installmentCount}`,
          currencyType: purchase.currencyType || "USD",
          conversionRate: purchase.conversionRate || "1",
        })
        .returning()

      installments.push(installment)
    }

    revalidatePath(`/sales/${purchaseId}`)
    return { success: true, data: { paymentPlan, installments } }
  } catch (error) {
    console.error("Error creating payment plan:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el plan de pago",
    }
  }
}

export async function recordPayment({
  paymentId,
  paymentMethod,
  transactionReference,
  paymentDate = new Date(),
  notes,
  currencyType,
  conversionRate,
}: {
  paymentId: string
  paymentMethod: string
  transactionReference?: string
  paymentDate?: Date
  notes?: string
  currencyType?: string
  conversionRate?: string
}) {
  try {
    // Get the payment to update
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId))

    if (!payment) {
      return { success: false, error: "Pago no encontrado" }
    }

    // Actualizar el pago
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "PAID",
        paymentDate,
        paymentMethod,
        transactionReference,
        notes,
        currencyType: currencyType || payment.currencyType || "USD",
        conversionRate: conversionRate || payment.conversionRate || "1",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning()

    if (!updatedPayment) {
      return { success: false, error: "Pago no encontrado" }
    }

    // Verificar si todos los pagos de la compra están pagados
    const pendingPayments = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(eq(payments.purchaseId, updatedPayment.purchaseId), eq(payments.status, "PENDING")))

    // Si no hay pagos pendientes, marcar la compra como pagada
    if (pendingPayments[0].count === 0) {
      await db
        .update(purchases)
        .set({
          isPaid: true,
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, updatedPayment.purchaseId))

      // Delete any pending payments (auto-purge)
      await db
        .delete(payments)
        .where(and(eq(payments.purchaseId, updatedPayment.purchaseId), eq(payments.status, "PENDING")))
    }

    revalidatePath(`/sales/${updatedPayment.purchaseId}`)
    return { success: true, data: updatedPayment }
  } catch (error) {
    console.error("Error recording payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar el pago",
    }
  }
}

export async function getPaymentsByPurchase(purchaseId: string) {
  try {
    const result = await db.select().from(payments).where(eq(payments.purchaseId, purchaseId)).orderBy(payments.dueDate)

    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { success: false, error: "Error al obtener los pagos" }
  }
}

export async function getPaymentPlan(purchaseId: string) {
  try {
    const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.purchaseId, purchaseId))

    if (!plan) {
      return { success: false, error: "Plan de pago no encontrado" }
    }

    return { success: true, data: plan }
  } catch (error) {
    console.error("Error fetching payment plan:", error)
    return { success: false, error: "Error al obtener el plan de pago" }
  }
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
  try {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning()

    if (!updatedPayment) {
      return { success: false, error: "Pago no encontrado" }
    }

    revalidatePath(`/sales/${updatedPayment.purchaseId}`)
    return { success: true, data: updatedPayment }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el estado del pago",
    }
  }
}

// Add partial payment
export async function addPartialPayment({
  purchaseId,
  amount,
  paymentMethod,
  currencyType = "USD",
  conversionRate = 1,
  transactionReference,
  paymentDate = new Date(),
  notes,
  originalAmount,
}: {
  purchaseId: string
  amount: number
  paymentMethod: string
  currencyType?: string
  conversionRate?: number
  transactionReference?: string
  paymentDate?: Date
  notes?: string
  originalAmount?: number
}) {
  try {
    // Get the purchase to check remaining amount
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId))

    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Get existing payments
    const existingPayments = await db
      .select({
        totalPaid: sql`SUM(CAST(${payments.amount} AS DECIMAL))`,
      })
      .from(payments)
      .where(and(eq(payments.purchaseId, purchaseId), eq(payments.status, "PAID")))

    const totalPaid = existingPayments[0]?.totalPaid || 0
    const totalAmount = Number(purchase.totalAmount)
    const remainingAmount = totalAmount - Number(totalPaid)

    // Calculate original amount based on currency
    let finalOriginalAmount = originalAmount || amount
    if (!originalAmount && currencyType !== purchase.currencyType) {
      // If paying in different currency, convert to purchase currency
      if (currencyType === "BS" && purchase.currencyType === "USD") {
        finalOriginalAmount = amount / conversionRate
      } else if (currencyType === "USD" && purchase.currencyType === "BS") {
        finalOriginalAmount = amount * conversionRate
      }
    }

    // Create the payment
    const [newPayment] = await db
      .insert(payments)
      .values({
        purchaseId,
        amount: amount.toString(),
        originalAmount: finalOriginalAmount.toString(),
        status: "PAID",
        paymentDate,
        paymentMethod,
        currencyType,
        conversionRate: conversionRate.toString(),
        transactionReference,
        notes: notes || `Pago parcial de ${amount} ${currencyType}`,
      })
      .returning()

    // Check if this payment completes the purchase (with small tolerance for rounding)
    const newTotalPaid = Number(totalPaid) + finalOriginalAmount
    const isFullyPaid = newTotalPaid >= totalAmount - 0.01

    if (isFullyPaid) {
      // Update purchase to paid
      await db
        .update(purchases)
        .set({
          isPaid: true,
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, purchaseId))

      // Auto-purge any pending payments
      await db.delete(payments)
        .where(and(eq(payments.purchaseId, purchaseId), eq(payments.status, "PENDING")))
    }

    return { success: true, data: newPayment, isFullyPaid }
  } catch (error) {
    console.error("Error adding partial payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar el pago parcial",
    }
  }
}

// Get remaining balance for a purchase
export async function getRemainingBalance(purchaseId: string) {
  try {
    // Get the purchase
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId))

    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Get existing payments
    const existingPayments = await db
      .select({
        totalPaid: sql`SUM(CAST(${payments.amount} AS DECIMAL))`,
      })
      .from(payments)
      .where(and(eq(payments.purchaseId, purchaseId), eq(payments.status, "PAID")))

    const totalPaid = Number(existingPayments[0]?.totalPaid || 0)
    const totalAmount = Number(purchase.totalAmount)

    // Round to 2 decimal places to avoid floating point precision issues
    const roundedTotalPaid = Math.round(totalPaid * 100) / 100
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100
    const remainingAmount = Math.round((roundedTotalAmount - roundedTotalPaid) * 100) / 100

    // Consider paid if remaining amount is less than 0.01
    const isPaid = remainingAmount <= 0.01

    return {
      success: true,
      data: {
        totalAmount: roundedTotalAmount,
        totalPaid: roundedTotalPaid,
        remainingAmount: isPaid ? 0 : remainingAmount, // If considered paid, show 0 remaining
        isPaid,
        currencyType: purchase.currencyType || "USD",
        conversionRate: Number(purchase.conversionRate || 1),
      },
    }
  } catch (error) {
    console.error("Error getting remaining balance:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener el saldo pendiente",
    }
  }
}

// Función auxiliar para generar fechas de vencimiento
function generateDueDates(startDate: Date, count: number, frequency: InstallmentFrequency): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < count; i++) {
    const nextDate = new Date(currentDate)

    if (frequency === "WEEKLY") {
      nextDate.setDate(nextDate.getDate() + 7)
    } else if (frequency === "BIWEEKLY") {
      nextDate.setDate(nextDate.getDate() + 14)
    } else {
      // MONTHLY
      nextDate.setMonth(nextDate.getMonth() + 1)
    }

    dates.push(nextDate)
    currentDate = nextDate
  }

  return dates
}

