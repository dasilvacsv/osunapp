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

