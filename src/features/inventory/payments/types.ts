// types/index.ts
export interface PaymentData {
    id: string
    amount: string
    currencyType: "USD" | "BS"
    status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED"
    paymentDate: Date
    purchaseId: string
    conversionRate: number
    client: {
      name: string
      document?: string
    }
    pendingAmount: string
  }
  
  export interface PaymentMetrics {
    totalUSD: number
    totalBS: number
    pendingPayments: number
    overduePayments: number
  }