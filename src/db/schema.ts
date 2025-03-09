import {
  varchar,
  uuid,
  integer,
  boolean,
  text,
  pgTable,
  date,
  pgEnum,
  timestamp,
  decimal,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"])

export const organizationTypeEnum = pgEnum("organization_type", ["SCHOOL", "COMPANY", "OTHER"])

export const clientRoleEnum = pgEnum("client_role", ["PARENT", "EMPLOYEE", "INDIVIDUAL"])

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
])

export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "OVERDUE", "CANCELLED"])
export const paymentTypeEnum = pgEnum("payment_type", ["FULL", "INSTALLMENT", "DEPOSIT"])
export const installmentFrequencyEnum = pgEnum("installment_frequency", ["WEEKLY", "BIWEEKLY", "MONTHLY"])
export const saleTypeEnum = pgEnum("sale_type", ["DIRECT", "PRESALE"])

export const organizationMemberRoleEnum = pgEnum("organization_member_role", ["ADMIN", "MEMBER"])

export const itemTypeEnum = pgEnum("item_type", ["PHYSICAL", "DIGITAL", "SERVICE"])

export const bundleTypeEnum = pgEnum("bundle_type", ["SCHOOL_PACKAGE", "ORGANIZATION_PACKAGE", "REGULAR"])

export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN"])

export const BORROW_STATUS_ENUM = pgEnum("borrow_status", ["BORROWED", "RETURNED"])

// New Enums for Inventory Items
export const inventoryItemTypeEnum = pgEnum("inventory_item_type", ["PHYSICAL", "DIGITAL", "SERVICE"])

export const inventoryItemStatusEnum = pgEnum("inventory_item_status", ["ACTIVE", "INACTIVE"])

export const bundleBeneficiaryStatusEnum = pgEnum("bundle_beneficiary_status", ["ACTIVE", "INACTIVE"])

// New enums for organization nature and section template status
export const organizationNatureEnum = pgEnum("organization_nature", ["PUBLIC", "PRIVATE"])
export const sectionTemplateStatusEnum = pgEnum("section_template_status", ["COMPLETE", "INCOMPLETE", "PENDING"])

// New enum for transaction types
export const transactionTypeEnum = pgEnum("transaction_type", [
  "INITIAL",
  "IN",
  "OUT",
  "ADJUSTMENT",
  "RESERVATION",
  "FULFILLMENT",
])

export const payments = pgTable("payments", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("PENDING"),
  paymentDate: timestamp("payment_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionReference: varchar("transaction_reference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Tabla de planes de pago
export const paymentPlans = pgTable("payment_plans", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }),
  installmentCount: integer("installment_count").notNull(),
  installmentFrequency: installmentFrequencyEnum("installment_frequency").default("MONTHLY"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Extensión de la tabla de compras
export const purchasesExtended = {
  saleType: saleTypeEnum("sale_type").default("DIRECT"),
  paymentType: paymentTypeEnum("payment_type").default("FULL"),
  isPaid: boolean("is_paid").default(false),
  organizationId: uuid("organization_id"),
}

// Cities table for organization locations
export const cities = pgTable(
  "cities",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }),
    country: varchar("country", { length: 255 }).notNull().default("Venezuela"),
    status: statusEnum("status").default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      nameIdx: uniqueIndex("cities_name_idx").on(table.name),
    }
  },
)

// Organizations Table
export const organizations = pgTable("organizations", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: organizationTypeEnum("type").notNull(),
  address: text("address"),
  contactInfo: jsonb("contact_info"), // Store phone, email, etc.
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // New fields for organization
  nature: organizationNatureEnum("nature").default("PRIVATE"),
  cityId: uuid("city_id").references(() => cities.id),
})

// Organization sections table
export const organizationSections = pgTable("organization_sections", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  level: varchar("level", { length: 100 }).notNull(), // e.g., "Preescolar", "5TO Año"
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  templateLink: text("template_link"),
  templateStatus: sectionTemplateStatusEnum("template_status").default("PENDING"),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 255 }).unique(),
  phone: varchar("phone"),
  whatsapp: varchar("whatsapp"),
  contactInfo: jsonb("contact_info"), // Store phone, email, etc.
  organizationId: uuid("organization_id").references(() => organizations.id),
  role: clientRoleEnum("role").notNull(),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Children Table
export const children = pgTable("children", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  grade: varchar("grade", { length: 50 }),
  section: varchar("section", { length: 50 }),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Inventory Items Table - Updated with new fields
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).unique(),
    description: text("description"),
    type: itemTypeEnum("type").notNull(),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    currentStock: integer("current_stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
    minimumStock: integer("minimum_stock").notNull().default(0),
    expectedRestock: timestamp("expected_restock", { withTimezone: true }),
    metadata: jsonb("metadata"),
    status: statusEnum("status").default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    // New fields for inventory analytics
    margin: decimal("margin", { precision: 5, scale: 2 }).default("0.30"), // Default 30% margin
    projectedStock: integer("projected_stock"), // For inventory projections
    averageDailySales: decimal("average_daily_sales", { precision: 10, scale: 2 }), // For sales analytics
  },
  (table) => {
    return {
      skuIdx: uniqueIndex("inventory_items_sku_idx").on(table.sku),
      statusIdx: index("inventory_items_status_idx").on(table.status),
      stockIdx: index("inventory_items_stock_idx").on(table.currentStock),
    }
  },
)

// Updated inventory transactions table
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  reference: jsonb("reference"), // Store related purchase/bundle info
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
})

// Bundles Table
export const bundles = pgTable("bundles", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: bundleTypeEnum("type").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  categoryId: uuid("category_id").references(() => bundleCategories.id),
  // New tracking fields
  totalSales: integer("total_sales").notNull().default(0),
  lastSaleDate: timestamp("last_sale_date", { withTimezone: true }),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
})

// Bundle Items Table (Connects Bundles with Inventory Items)
export const bundleItems = pgTable("bundle_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => bundles.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  overridePrice: decimal("override_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Bundle Beneficiaries Table
export const bundleBeneficiaries = pgTable("bundle_beneficiaries", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => bundles.id),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  school: varchar("school", { length: 255 }).notNull(),
  level: varchar("level", { length: 50 }).notNull(),
  section: varchar("section", { length: 50 }).notNull(),
  status: bundleBeneficiaryStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Add reference to organization for template matching
  organizationId: uuid("organization_id").references(() => organizations.id),
})

// Purchases Table
export const purchases = pgTable("purchases", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  childId: uuid("child_id").references(() => children.id),
  bundleId: uuid("bundle_id").references(() => bundles.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  status: purchaseStatusEnum("status").notNull().default("PENDING"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status"),
  paymentMetadata: jsonb("payment_metadata"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("CASH"),
  transactionReference: varchar("transaction_reference", { length: 255 }),
  bookingMethod: varchar("booking_method", { length: 50 }),
  paymentType: text("payment_type"),
  isPaid: boolean("is_paid").default(false),
})

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Purchase Items Table
export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Organization Members Table
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  role: organizationMemberRoleEnum("role").notNull(),
  status: statusEnum("status").default("ACTIVE"),
  joinDate: timestamp("join_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: ROLE_ENUM("role").default("USER"),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
})

export const bundleCategories = pgTable("bundle_categories", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// New tables for inventory purchases and sales tracking

// Purchase table for inventory - to track cost averaging
export const inventoryPurchases = pgTable("inventory_purchases", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Purchase items table - details of each purchase
export const inventoryPurchaseItems = pgTable("inventory_purchase_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => inventoryPurchases.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// Sales table for tracking item sales
export const sales = pgTable("sales", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  orderReference: varchar("order_reference", { length: 100 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Sale items table - details of each sale
export const saleItems = pgTable("sale_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// Relations
export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
  bundleItems: many(bundleItems),
  purchaseItems: many(purchaseItems),
  inventoryPurchaseItems: many(inventoryPurchaseItems),
  saleItems: many(saleItems),
}))

export const inventoryPurchasesRelations = relations(inventoryPurchases, ({ many }) => ({
  items: many(inventoryPurchaseItems),
}))

export const inventoryPurchaseItemsRelations = relations(inventoryPurchaseItems, ({ one }) => ({
  purchase: one(inventoryPurchases, {
    fields: [inventoryPurchaseItems.purchaseId],
    references: [inventoryPurchases.id],
  }),
  item: one(inventoryItems, {
    fields: [inventoryPurchaseItems.itemId],
    references: [inventoryItems.id],
  }),
}))

export const salesRelations = relations(sales, ({ many }) => ({
  items: many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  item: one(inventoryItems, {
    fields: [saleItems.itemId],
    references: [inventoryItems.id],
  }),
}))