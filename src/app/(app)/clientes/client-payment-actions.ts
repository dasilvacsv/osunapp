"use server"

import { db } from "@/db"
import { purchases, payments, clients } from "@/db/schema"
import { eq, sql, desc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { PaymentStatus } from "@/features/payments/payment-types"

// Get all purchases and payments for a client
export async function getClientPurchases(clientId: string) {
  try {
    // Get all purchases for this client
    const clientPurchases = await db
      .select()
      .from(purchases)
      .where(eq(purchases.clientId, clientId))
      .orderBy(desc(purchases.purchaseDate))

    // Get all payments for these purchases
    const allPayments = []
    for (const purchase of clientPurchases) {
      const purchasePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.purchaseId, purchase.id))
        .orderBy(desc(payments.paymentDate))

      allPayments.push(...purchasePayments)
    }

    return {
      success: true,
      data: {
        purchases: clientPurchases,
        payments: allPayments,
      },
    }
  } catch (error) {
    console.error("Error fetching client purchases:", error)
    return { success: false, error: "Error al obtener las compras del cliente" }
  }
}

// Get payment summary for a client
export async function getClientPaymentSummary(clientId: string) {
  try {
    // Get all purchases for this client
    const clientPurchases = await db
      .select({
        id: purchases.id,
        totalAmount: purchases.totalAmount,
        isPaid: purchases.isPaid,
        purchaseDate: purchases.purchaseDate,
      })
      .from(purchases)
      .where(eq(purchases.clientId, clientId))

    if (clientPurchases.length === 0) {
      return {
        success: true,
        data: {
          totalAmount: 0,
          paidAmount: 0,
          remainingBalance: 0,
          status: "PAID",
          isOverdue: false,
          purchaseCount: 0,
          firstPurchaseDate: null,
          lastPurchaseDate: null,
          paymentCount: 0,
        },
      }
    }

    // Calculate total amount from all purchases
    const totalAmount = clientPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0)

    // Get all purchase IDs
    const purchaseIds = clientPurchases.map((purchase) => purchase.id)

    // Get all payments for these purchases
    const allPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
      })
      .from(payments)
      .where(inArray(payments.purchaseId, purchaseIds))
      .orderBy(desc(payments.paymentDate))

    // Get paid payments
    const paidPayments = allPayments.filter((payment) => payment.status === "PAID")

    // Calculate total paid amount
    const paidAmount = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Calculate remaining balance
    const remainingBalance = totalAmount - paidAmount

    // Find the last payment date
    const lastPaymentDate = paidPayments.length > 0 ? new Date(paidPayments[0].paymentDate!) : undefined

    // Calculate days since last payment
    const daysSinceLastPayment = lastPaymentDate
      ? Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined

    // Determine if account is overdue (last payment > 30 days ago or has overdue payments)
    const isOverdue = daysSinceLastPayment ? daysSinceLastPayment > 30 : false

    // Check for overdue payments
    const overduePayments = allPayments.filter((payment) => payment.status === "OVERDUE")
    const hasOverduePayments = overduePayments.length > 0

    // Determine payment status
    let status: PaymentStatus = "PAID"
    if (remainingBalance > 0) {
      status = isOverdue || hasOverduePayments ? "OVERDUE" : "PARTIAL"
    } else if (remainingBalance === totalAmount) {
      status = "PENDING"
    }

    // Get first and last purchase dates
    const purchaseDates = clientPurchases
      .map((purchase) => new Date(purchase.purchaseDate!))
      .sort((a, b) => a.getTime() - b.getTime())

    const firstPurchaseDate = purchaseDates.length > 0 ? purchaseDates[0] : null
    const lastPurchaseDate = purchaseDates.length > 0 ? purchaseDates[purchaseDates.length - 1] : null

    // Calculate payment methods distribution
    const paymentMethodsCount: Record<string, number> = {}
    paidPayments.forEach((payment) => {
      const method = payment.paymentMethod || "UNKNOWN"
      paymentMethodsCount[method] = (paymentMethodsCount[method] || 0) + 1
    })

    // If account is overdue, update client status to reflect this
    if (isOverdue || hasOverduePayments) {
      await updateClientDebtorStatus(clientId, true)
    }

    return {
      success: true,
      data: {
        totalAmount,
        paidAmount,
        remainingBalance,
        lastPaymentDate,
        status,
        isOverdue: isOverdue || hasOverduePayments,
        daysSinceLastPayment,
        purchaseCount: clientPurchases.length,
        firstPurchaseDate,
        lastPurchaseDate,
        paymentCount: paidPayments.length,
        paymentMethodsDistribution: paymentMethodsCount,
        overduePaymentsCount: overduePayments.length,
      },
    }
  } catch (error) {
    console.error("Error calculating payment summary:", error)
    return { success: false, error: "Error al calcular el resumen de pagos" }
  }
}

// Update client debtor status
export async function updateClientDebtorStatus(clientId: string, isDeudor: boolean) {
  try {
    await db
      .update(clients)
      .set({
        deudor: isDeudor,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))

    revalidatePath(`/clientes/${clientId}`)
    revalidatePath("/clientes")

    return { success: true }
  } catch (error) {
    console.error("Error updating client debtor status:", error)
    return { success: false, error: "Error al actualizar el estado de deudor del cliente" }
  }
}

// Check for overdue clients
export async function checkOverdueClients() {
  try {
    // Find clients with payments that are overdue
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all clients with their purchases
    const clientsWithPurchases = await db
      .select({
        clientId: purchases.clientId,
      })
      .from(purchases)
      .groupBy(purchases.clientId)

    // For each client, check if they have overdue payments
    for (const client of clientsWithPurchases) {
      // Get client's payment summary
      const paymentSummary = await getClientPaymentSummary(client.clientId)

      // If client has overdue payments, mark them as a debtor
      if (paymentSummary.success && paymentSummary.data?.isOverdue) {
        await updateClientDebtorStatus(client.clientId, true)
      }
    }

    return { success: true, data: clientsWithPurchases }
  } catch (error) {
    console.error("Error checking overdue clients:", error)
    return { success: false, error: "Error al verificar clientes con pagos vencidos" }
  }
}

// Send payment confirmation
export async function sendPaymentConfirmation(purchaseId: string) {
  try {
    // Get purchase details
    const [purchase] = await db
      .select({
        purchase: purchases,
        client: clients,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .where(eq(purchases.id, purchaseId))
      .limit(1)

    if (!purchase) {
      return { success: false, error: "Compra no encontrada" }
    }

    // Get payments for this purchase
    const purchasePayments = await db.select().from(payments).where(eq(payments.purchaseId, purchaseId))

    // Calculate total paid amount
    const totalPaid = purchasePayments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

    const remainingBalance = Number(purchase.purchase.totalAmount) - totalPaid

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    }

    // Prepare message content
    const message = `
      Estimado/a ${purchase.client.name},
      
      Confirmamos el recibo de su pago por ${formatCurrency(totalPaid)}.
      
      Detalles del pago:
      - Total a pagar: ${formatCurrency(Number(purchase.purchase.totalAmount))}
      - Total pagado: ${formatCurrency(totalPaid)}
      - Saldo pendiente: ${formatCurrency(remainingBalance)}
      
      ${
        remainingBalance > 0
          ? "Aún tiene un saldo pendiente. Por favor, complete su pago a la brevedad."
          : "Su pago ha sido completado en su totalidad. ¡Gracias!"
      }
      
      Atentamente,
      El equipo de [Nombre de la Empresa]
    `

    // In a real implementation, you would send this message via WhatsApp, email, etc.
    // For now, we'll just return the message content

    return {
      success: true,
      data: {
        message,
        clientPhone: purchase.client.phone,
        clientWhatsapp: purchase.client.whatsapp,
        clientEmail: purchase.client.contactInfo?.email,
      },
    }
  } catch (error) {
    console.error("Error sending payment confirmation:", error)
    return { success: false, error: "Error al enviar la confirmación de pago" }
  }
}

