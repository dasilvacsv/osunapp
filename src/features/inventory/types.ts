export interface InventoryItem {
  id: string
  name: string
  sku: string | null
  description: string | null
  type: "PHYSICAL" | "DIGITAL" | "SERVICE"
  basePrice: string
  costPrice?: string // Nuevo campo para precio de costo
  currentStock: number
  reservedStock: number
  minimumStock: number
  maximumStock?: number
  allowPresale: boolean
  status: "ACTIVE" | "INACTIVE"
  preSaleCount?: number
  createdAt: Date | null
  updatedAt: Date | null
  metadata?: Record<string, any>
}

export interface InventoryTransaction {
  id: string
  itemId: string
  quantity: number
  transactionType: "INITIAL" | "IN" | "OUT" | "ADJUSTMENT" | "RESERVATION" | "FULFILLMENT"
  reference: string | null | Record<string, any>
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
  createdBy: string | null
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type InventoryTableProps = {
  items: InventoryItem[]
  onItemDisabled?: () => void
  onItemUpdated?: () => void
}

export type InventoryManagerProps = {
  initialData: InventoryItem[]
}

// Nuevas interfaces para compras a crédito
export interface PurchasePayment {
  id: string
  purchaseId: string
  amount: string
  paymentDate: Date
  paymentMethod: "CASH" | "TRANSFER" | "CHECK" | "OTHER"
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Purchase {
  id: string
  supplierName: string
  invoiceNumber?: string
  totalAmount: string
  paidAmount: string
  status: "PAID" | "PARTIAL" | "PENDING"
  purchaseDate: Date
  dueDate?: Date
  isCredit: boolean
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  itemId: string
  quantity: number
  unitCost: string
  totalCost: string
}

// Interfaces para bundles con costos
export interface BundleItem {
  itemId: string
  item: InventoryItem
  quantity: number
  overridePrice?: number
  costPrice?: number // Nuevo campo para mostrar el costo
}

export interface BundleWithItems extends Bundle {
  items: BundleItem[]
  totalBasePrice: number
  totalCostPrice: number // Nuevo campo para el costo total
  totalDiscountedPrice: number
  savings: number
  savingsPercentage: number
  profit: number // Nuevo campo para el margen de ganancia
  profitPercentage: number // Nuevo campo para el porcentaje de ganancia
}

export interface Bundle {
  items: any
  id: string
  name: string
  description?: string
  categoryId: string
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
  basePrice: number
  costPrice?: number // Nuevo campo para el costo del bundle
  discountPercentage?: number
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
}

export type CreateBundleInput = {
  name: string
  description?: string
  categoryId: string
  items: {
    itemId: string
    quantity: number
    overridePrice?: number
  }[]
  totalBasePrice: number
  totalCostPrice: number // Nuevo campo para el costo total
  savingsPercentage: number
}

