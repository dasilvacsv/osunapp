"use server"
import { db } from "@/db"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { clientPayments, paymentTransactions, clients } from "@/db/schema"
import type { PaymentSummary, PaymentStatus } from "@/features/payments/payment-types"

export type PaymentFormData = {
  clientId: string
  amount: number
  date: Date
  description?: string
  status: PaymentStatus
}

export type PaymentTransactionFormData = {
  paymentId: string
  amount: number
  date: Date
  method: "CASH" | "TRANSFER" | "CARD" | "OTHER"
  reference?: string
  notes?: string
}

export async function getClientPayments(clientId: string) {
  try {
    const data = await db
      .select()
      .from(clientPayments)
      .where(eq(clientPayments.clientId, clientId))
      .orderBy(sql`${clientPayments.date} DESC`)

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching client payments:", error)
    return { success: false, error: "Error al obtener los pagos del cliente" }
  }
}

export async function getPaymentTransactions(paymentId: string) {
  try {
    const data = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.paymentId, paymentId))
      .orderBy(sql`${paymentTransactions.date} DESC`)

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching payment transactions:", error)
    return { success: false, error: "Error al obtener las transacciones del pago" }
  }
}

export async function createPayment(data: PaymentFormData) {
  try {
    const newPayment = await db
      .insert(clientPayments)
      .values({
        clientId: data.clientId,
        amount: data.amount,
        date: data.date,
        description: data.description,
        status: data.status,
      })
      .returning()

    // Reset deudor status when a new payment is created
    await updateClientDebtorStatus(data.clientId, false)

    revalidatePath(`/clientes/${data.clientId}`)
    return { success: true, data: newPayment[0] }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { success: false, error: "Error al crear el pago" }
  }
}

export async function createPaymentTransaction(data: PaymentTransactionFormData) {
  try {
    const newTransaction = await db
      .insert(paymentTransactions)
      .values({
        paymentId: data.paymentId,
        amount: data.amount,
        date: data.date,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      })
      .returning()

    // Get the payment to update its status
    const payment = await db.select().from(clientPayments).where(eq(clientPayments.id, data.paymentId)).limit(1)

    if (payment.length > 0) {
      // Get all transactions for this payment
      const transactions = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.paymentId, data.paymentId))

      // Calculate total paid amount
      const totalPaid = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)

      // Update payment status based on paid amount
      let newStatus: PaymentStatus = "PENDING"
      if (totalPaid >= Number(payment[0].amount)) {
        newStatus = "PAID"
      } else if (totalPaid > 0) {
        newStatus = "PARTIAL"
      }

      // Update the payment status
      await db
        .update(clientPayments)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(clientPayments.id, data.paymentId))

      // Reset deudor status when a new transaction is created
      await updateClientDebtorStatus(payment[0].clientId, false)

      revalidatePath(`/clientes/${payment[0].clientId}`)
    }

    return { success: true, data: newTransaction[0] }
  } catch (error) {
    console.error("Error creating payment transaction:", error)
    return { success: false, error: "Error al registrar la transacción de pago" }
  }
}

export async function getClientPaymentSummary(
  clientId: string,
): Promise<{ success: boolean; data?: PaymentSummary; error?: string }> {
  try {
    // Get all payments for the client
    const clientPaymentsData = await db.select().from(clientPayments).where(eq(clientPayments.clientId, clientId))

    if (clientPaymentsData.length === 0) {
      return {
        success: true,
        data: {
          totalAmount: 0,
          paidAmount: 0,
          remainingBalance: 0,
          status: "PAID",
          isOverdue: false,
        },
      }
    }

    // Calculate total amount from all payments
    const totalAmount = clientPaymentsData.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Get all transactions for all payments
    const paymentIds = clientPaymentsData.map((payment) => payment.id)
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(sql`${paymentTransactions.paymentId} IN (${paymentIds})`)

    // Calculate total paid amount
    const paidAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)

    // Calculate remaining balance
    const remainingBalance = totalAmount - paidAmount

    // Find the last payment date
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const lastPaymentDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].date) : undefined

    // Calculate days since last payment
    const daysSinceLastPayment = lastPaymentDate
      ? Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined

    // Determine if account is overdue (last payment > 30 days ago)
    const isOverdue = daysSinceLastPayment ? daysSinceLastPayment > 30 : false

    // Determine payment status
    let status: PaymentStatus = "PAID"
    if (remainingBalance > 0) {
      status = isOverdue ? "OVERDUE" : "PARTIAL"
    } else if (remainingBalance === totalAmount) {
      status = "PENDING"
    }

    // If account is overdue, update client status to reflect this
    if (isOverdue) {
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
        isOverdue,
        daysSinceLastPayment,
      },
    }
  } catch (error) {
    console.error("Error calculating payment summary:", error)
    return { success: false, error: "Error al calcular el resumen de pagos" }
  }
}

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

export async function checkOverdueClients() {
  try {
    // Find clients with payments where the last transaction was more than 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all clients with their latest transaction date
    const clientsWithLastPayment = await db
      .select({
        clientId: clients.id,
        lastPaymentDate: sql<Date | null>`
          (SELECT MAX(pt.date) 
           FROM ${paymentTransactions} pt
           JOIN ${clientPayments} cp ON pt.payment_id = cp.id
           WHERE cp.client_id = ${clients.id})
        `,
      })
      .from(clients)
      .where(eq(clients.status, "ACTIVE"))

    // Update deudor status based on last payment date
    for (const client of clientsWithLastPayment) {
      const isOverdue = client.lastPaymentDate ? new Date(client.lastPaymentDate) < thirtyDaysAgo : false

      // Only update if there's a last payment date and it's overdue
      if (client.lastPaymentDate && isOverdue) {
        await updateClientDebtorStatus(client.clientId, true)
      }
    }

    return { success: true, data: clientsWithLastPayment }
  } catch (error) {
    console.error("Error checking overdue clients:", error)
    return { success: false, error: "Error al verificar clientes con pagos vencidos" }
  }
}

export async function sendPaymentConfirmation(paymentId: string) {
  try {
    // Get payment details
    const payment = await db
      .select({
        payment: clientPayments,
        client: clients,
      })
      .from(clientPayments)
      .leftJoin(clients, eq(clientPayments.clientId, clients.id))
      .where(eq(clientPayments.id, paymentId))
      .limit(1)

    if (!payment.length) {
      return { success: false, error: "Pago no encontrado" }
    }

    const { payment: paymentData, client } = payment[0]

    // Get transactions for this payment
    const transactions = await db.select().from(paymentTransactions).where(eq(paymentTransactions.paymentId, paymentId))

    // Calculate total paid amount
    const totalPaid = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const remainingBalance = Number(paymentData.amount) - totalPaid

    // Prepare message content
    const message = `
      Estimado/a ${client.name},
      
      Confirmamos el recibo de su pago por $${totalPaid.toFixed(2)}.
      
      Detalles del pago:
      - Total a pagar: $${Number(paymentData.amount).toFixed(2)}
      - Total pagado: $${totalPaid.toFixed(2)}
      - Saldo pendiente: $${remainingBalance.toFixed(2)}
      
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
        clientPhone: client.phone,
        clientWhatsapp: client.whatsapp,
        clientEmail: client.contactInfo?.email,
      },
    }
  } catch (error) {
    console.error("Error sending payment confirmation:", error)
    return { success: false, error: "Error al enviar la confirmación de pago" }
  }
}

