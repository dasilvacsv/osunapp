export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE"

export interface Payment {
  id: string
  clientId: string
  amount: number
  date: Date
  description?: string
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export interface PaymentTransaction {
  id: string
  paymentId: string
  amount: number
  date: Date
  method: "CASH" | "TRANSFER" | "CARD" | "OTHER"
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentSummary {
  totalAmount: number
  paidAmount: number
  remainingBalance: number
  lastPaymentDate?: Date
  status: PaymentStatus
  isOverdue: boolean
  daysSinceLastPayment?: number
}

