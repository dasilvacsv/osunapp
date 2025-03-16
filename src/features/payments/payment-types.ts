export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "CANCELLED"

export interface PaymentSummary {
  totalAmount: number
  paidAmount: number
  remainingBalance: number
  lastPaymentDate?: Date
  status: PaymentStatus
  isOverdue: boolean
  daysSinceLastPayment?: number
}

export interface Payment {
  id: string
  clientId: string
  amount: number
  date: string | Date
  description?: string
  status: PaymentStatus
  createdAt: string | Date
  updatedAt: string | Date
}

export interface PaymentTransaction {
  id: string
  paymentId: string
  amount: number
  date: string | Date
  method: "CASH" | "TRANSFER" | "CARD" | "OTHER"
  reference?: string
  notes?: string
  createdAt: string | Date
  updatedAt?: string | Date
}

