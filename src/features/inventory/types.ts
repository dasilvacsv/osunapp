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
  status: "ACTIVE" | "INACTIVE" | null // Permitir null para coincidir con el esquema
  preSaleCount?: number
  createdAt: Date | null
  updatedAt: Date | null
  metadata?: Record<string, any>
  margin?: string
  costPrice?: string // Asegurarse de que costPrice esté definido
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

// Interfaz Bundle unificada
export interface Bundle {
  id: string
  name: string
  description?: string
  notes?: string // Campo para notas
  categoryId: string
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
  basePrice: string | number // Puede ser string o number dependiendo de la fuente
  bundlePrice?: string | number // Precio de venta (puede ser string o number)
  discountPercentage?: string | number // Puede ser string o number
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
  currencyType?: string // Mantener como string para compatibilidad
  conversionRate?: string
  organizationId?: string
  // Campos adicionales que pueden estar en el esquema
  totalSales?: number
  lastSaleDate?: Date
  totalRevenue?: string
}

// Interfaces para bundles
export interface BundleItem {
  itemId: string
  item: InventoryItem
  quantity: number
  overridePrice?: number
  costPrice?: number
}

export interface BundleWithItems {
  id: string
  name: string
  description: string | null
  notes: string | null // Añade el campo notes aquí
  categoryId: string
  type: string
  basePrice: string
  bundlePrice: string | null
  discountPercentage: string | null
  currencyType: string
  conversionRate: string | null
  organizationId: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  organization: {
    id: string
    name: string
  } | null
  items: BundleItem[]
  totalBasePrice: number
  totalDiscountedPrice: number
  savings: number
  savingsPercentage: number
  totalEstimatedCost: number
  profit: number
  profitPercentage: number
}

export interface CreateBundleInput {
  name: string
  description?: string
  notes?: string // Añade el campo notes aquí también
  categoryId: string
  basePrice: number
  margin: number
  salePrice: number
  totalCostPrice: number
  currencyType?: string
  conversionRate?: number
  organizationId?: string
  items: {
    itemId: string
    quantity: number
  }[]
}

// Nuevo tipo para manejar cambios de inventario durante la edición de paquetes
export interface InventoryChange {
  itemId: string
  quantityChange: number // Positivo para devoluciones, negativo para retiros
}

// Tipo para la respuesta de la tasa de cambio BCV
export interface BCVRateResponse {
  rate: number
  date: string
  isError: boolean
}
