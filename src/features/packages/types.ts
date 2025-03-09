export type BundleStatus = "ACTIVE" | "INACTIVE"
export type BundleType = "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
export type PurchaseStatus = "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER"
export type OrganizationNature = "PUBLIC" | "PRIVATE"
export type SectionTemplateStatus = "COMPLETE" | "INCOMPLETE" | "PENDING"

export type BundleItem = {
  item: {
    id: string
    name: string
    sku: string
    basePrice: number
  }
  quantity: number
  overridePrice?: number
}

export type BundleSale = {
  id: string
  purchaseDate: Date
  clientName: string
  beneficiaryName: string
  amount: number
  status: PurchaseStatus
  paymentMethod: PaymentMethod
}

export type BundleWithBeneficiaries = {
  id: string
  name: string
  description: string
  status: BundleStatus
  type: BundleType
  basePrice: number
  discountPercentage: number | null
  categoryName?: string
  items?: BundleItem[]
  salesData?: {
    totalSales: number
    totalRevenue: number
    lastSaleDate: Date | null
    sales?: BundleSale[] // Hacer sales opcional
  }
  beneficiaries: Array<{
    id: string
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
    status: "ACTIVE" | "INACTIVE"
    organizationId?: string
    isComplete?: boolean
    createdAt: Date
    purchase: {
      id: string
      purchaseDate: Date
      totalAmount: number
      status: PurchaseStatus
      paymentMethod: PaymentMethod
    } | null
  }>
}

export type BundleBeneficiary = {
  id: string
  firstName: string
  lastName: string
  school: string
  level: string
  section: string
  status: "ACTIVE" | "INACTIVE"
  organizationId?: string
  isComplete?: boolean
  createdAt: Date
  bundleId: string
}

export type OrganizationSection = {
  id: string
  name: string
  level: string
  templateLink?: string
  templateStatus: SectionTemplateStatus
  status: "ACTIVE" | "INACTIVE"
}

export type BeneficiaryDetails = {
  beneficiary: {
    id: string
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
    status: "ACTIVE" | "INACTIVE"
    organizationId?: string
    isComplete?: boolean
    createdAt: Date
  }
  bundle: {
    id: string
    name: string
    basePrice: number
    type: BundleType
  } | null
  purchase: {
    id: string
    purchaseDate: Date
    totalAmount: number
    status: PurchaseStatus
    paymentMethod: PaymentMethod
  } | null
}

export type Purchase = {
  id: string
  clientId: string
  bundleId: string
  purchaseDate: Date
  totalAmount: number
  status: PurchaseStatus
  paymentMethod: PaymentMethod
  client: {
    name: string
    document: string
  }
  beneficiary: {
    firstName: string
    lastName: string
  } | null
}

