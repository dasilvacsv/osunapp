export interface Client {
  id: string
  name: string
  document: string | null
  phone: string | null
  whatsapp: string | null
  contactInfo: {
    email: string
    phone?: string
  } | null
  organizationId: string | null
  organization?: {
    id: string
    name: string
    type: "SCHOOL" | "COMPANY" | "OTHER"
    address?: string
    contactInfo?: {
      email?: string
      phone?: string
    }
    status: "ACTIVE" | "INACTIVE"
  }
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL"
  status: "ACTIVE" | "INACTIVE"
  deudor?: boolean // New field to track overdue accounts
  createdAt: Date | null
  updatedAt: Date | null
}

export interface Organization {
  id: string
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  address?: string
  contactInfo?: {
    email?: string
    phone?: string
  }
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
}

export interface AuthCredentials {
  fullName: string
  email: string
  password: string
  role?: "ADMIN" | "USER" | "OPERADOR"
}

export interface InventoryItem {
  id: string
  name: string
  sku: string | null
  description: string | null
  type: "PHYSICAL" | "DIGITAL" | "SERVICE"
  basePrice: string
  currentStock: number
  reservedStock: number
  minimumStock: number
  expectedRestock: Date | null
  metadata: Record<string, any> | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
}

export interface Sale {
  id: string
  client: Client
  purchaseDate: Date
  totalAmount: number
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"
  paymentMethod: string
  items: {
    inventoryItem: InventoryItem
    quantity: number
    unitPrice: number
  }[]
  transactionReference?: string
  bookingMethod?: string
}

export interface Beneficiary {
  id: string
  name: string
  clientId: string
  organizationId?: string | null
  grade?: string | null
  section?: string | null
  status: "ACTIVE" | "INACTIVE"
  firstName?: string | null
  lastName?: string | null
  school?: string | null
  level?: string | null
  bundleId?: string | null
  organization?: Organization
  createdAt: Date
  updatedAt: Date
}

export interface Section {
  id: string
  name: string
  level: string
  templateLink: string | null
  templateStatus: "COMPLETE" | "INCOMPLETE" | "PENDING"
  status: "ACTIVE" | "INACTIVE"
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export type SectionFormData = Pick<Section, "name" | "level" | "templateLink" | "templateStatus">

// New interfaces for payment tracking

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE"

export interface ClientPayment {
  id: string
  clientId: string
  amount: string | number
  date: Date
  description?: string | null
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export interface PaymentTransaction {
  id: string
  paymentId: string
  amount: string | number
  date: Date
  method: "CASH" | "TRANSFER" | "CARD" | "OTHER"
  reference?: string | null
  notes?: string | null
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

