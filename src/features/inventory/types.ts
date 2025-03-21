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
  maximumStock?: number
  allowPresale: boolean
  status: "ACTIVE" | "INACTIVE"
  preSaleCount?: number
  createdAt: Date | null
  updatedAt: Date | null
  metadata?: Record<string, any>
  margin?: string
  costPrice?: string // Add cost price field
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

export interface Purchase {
  id: string
  supplierName: string
  invoiceNumber?: string
  totalAmount: string
  purchaseDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  isPaid?: boolean
  paidAmount?: string
  status?: string
  dueDate?: Date
  metadata?: Record<string, any>
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  itemId: string
  quantity: number
  unitCost: string
  totalCost: string
}

export interface PurchasePayment {
  id: string
  purchaseId: string
  amount: string
  paymentMethod: string
  paymentDate: Date
  reference?: string
  notes?: string
  createdAt: Date
}

// Interfaces para bundles
export interface BundleItem {
  itemId: string
  item: InventoryItem
  quantity: number
  overridePrice?: number
  costPrice?: number // Add cost price field
}

export interface BundleWithItems extends Bundle {
  items: BundleItem[]
  totalBasePrice: number
  totalDiscountedPrice: number
  savings: number
  savingsPercentage: number
  totalEstimatedCost: number
  profit: number
  profitPercentage: number
}

export interface Bundle {
  items: any
  id: string
  name: string
  description?: string
  categoryId: string
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
  basePrice: number
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
  savingsPercentage: number
  totalCostPrice?: number // Add total cost price field
}

