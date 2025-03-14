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
export const inventoryItemTypeEnum = pgEnum("inventory_item_type", ["PHYSICAL", "DIGITAL", "SERVICE"])
export const inventoryItemStatusEnum = pgEnum("inventory_item_status", ["ACTIVE", "INACTIVE"])
export const bundleBeneficiaryStatusEnum = pgEnum("bundle_beneficiary_status", ["ACTIVE", "INACTIVE"])
export const organizationNatureEnum = pgEnum("organization_nature", ["PUBLIC", "PRIVATE"])
export const sectionTemplateStatusEnum = pgEnum("section_template_status", ["COMPLETE", "INCOMPLETE", "PENDING"])
export const transactionTypeEnum = pgEnum("transaction_type", [
  "INITIAL",
  "IN",
  "OUT",
  "ADJUSTMENT",
  "RESERVATION",
  "FULFILLMENT",
])
export const certificateStatusEnum = pgEnum("certificate_status", ["GENERATED", "NOT_GENERATED", "NEEDS_REVISION", "APPROVED"])

// Cities table for organization locations
export const cities = pgTable("cities", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }),
  country: varchar("country", { length: 255 }).notNull().default("Venezuela"),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const citiesRelations = relations(cities, ({ many }) => ({
  organizations: many(organizations),
}))

// Organizations Table
export const organizations = pgTable("organizations", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: organizationTypeEnum("type").notNull(),
  address: text("address"),
  contactInfo: jsonb("contact_info"), // Store phone, email, etc.
  status: statusEnum("status").default("ACTIVE"),
  nature: organizationNatureEnum("nature").default("PRIVATE"),
  cityId: uuid("city_id").references(() => cities.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  city: one(cities, {
    fields: [organizations.cityId],
    references: [cities.id],
  }),
  sections: many(organizationSections),
  clients: many(clients),
  beneficiarios: many(beneficiarios),
  bundles: many(bundles),
  members: many(organizationMembers),
  bundleCategories: many(bundleCategories),
  purchases: many(purchases),
}))

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

export const organizationSectionsRelations = relations(organizationSections, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSections.organizationId],
    references: [organizations.id],
  }),
}))

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

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  beneficiarios: many(beneficiarios),
  purchases: many(purchases),
  organizationMemberships: many(organizationMembers),
}))

// Beneficiarios Table (renamed from children)
export const beneficiarios = pgTable("beneficiarios", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  grade: varchar("grade", { length: 50 }),
  section: varchar("section", { length: 50 }),
  status: statusEnum("status").default("ACTIVE"),
  // Additional fields that were in bundleBeneficiaries
  bundleId: uuid("bundle_id").references(() => bundles.id),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  school: varchar("school", { length: 255 }),
  level: varchar("level", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const beneficiariosRelations = relations(beneficiarios, ({ one, many }) => ({
  client: one(clients, {
    fields: [beneficiarios.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [beneficiarios.organizationId],
    references: [organizations.id],
  }),
  bundle: one(bundles, {
    fields: [beneficiarios.bundleId],
    references: [bundles.id],
  }),
  purchases: many(purchases),
  certificates: many(certificates),
}))

// Certificates Table for tracking certificate generation and approval status
export const certificates = pgTable("certificates", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  beneficiarioId: uuid("beneficiario_id").references(() => beneficiarios.id),
  status: certificateStatusEnum("status").default("NOT_GENERATED"),
  fileUrl: varchar("file_url", { length: 512 }),
  notes: text("notes"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [certificates.purchaseId],
    references: [purchases.id],
  }),
  beneficiario: one(beneficiarios, {
    fields: [certificates.beneficiarioId],
    references: [beneficiarios.id],
  }),
}))

// Inventory Items Table
export const inventoryItems = pgTable("inventory_items", {
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
  margin: decimal("margin", { precision: 5, scale: 2 }).default("0.30"), // Default 30% margin
  projectedStock: integer("projected_stock"), // For inventory projections
  averageDailySales: decimal("average_daily_sales", { precision: 10, scale: 2 }), // For sales analytics
  allowPresale: boolean("allow_presale").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
  bundleItems: many(bundleItems),
  purchaseItems: many(purchaseItems),
  inventoryPurchaseItems: many(inventoryPurchaseItems),
  saleItems: many(saleItems),
}))

// Inventory transactions table
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

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryTransactions.createdBy],
    references: [users.id],
  }),
}))

// Bundle Categories
export const bundleCategories = pgTable("bundle_categories", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const bundleCategoriesRelations = relations(bundleCategories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bundleCategories.organizationId],
    references: [organizations.id],
  }),
  bundles: many(bundles),
}))

// Bundles Table
export const bundles = pgTable("bundles", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: bundleTypeEnum("type").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  bundlePrice: decimal("bundle_price", { precision: 10, scale: 2 }),
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

export const bundlesRelations = relations(bundles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bundles.organizationId],
    references: [organizations.id],
  }),
  category: one(bundleCategories, {
    fields: [bundles.categoryId],
    references: [bundleCategories.id],
  }),
  items: many(bundleItems),
  purchases: many(purchases),
  beneficiarios: many(beneficiarios),
}))

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

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleItems.bundleId],
    references: [bundles.id],
  }),
  item: one(inventoryItems, {
    fields: [bundleItems.itemId],
    references: [inventoryItems.id],
  }),
}))

// Purchases Table
export const purchases = pgTable("purchases", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  beneficiarioId: uuid("beneficiario_id").references(() => beneficiarios.id), // renamed from childId
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

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  client: one(clients, {
    fields: [purchases.clientId],
    references: [clients.id],
  }),
  beneficiario: one(beneficiarios, {
    fields: [purchases.beneficiarioId],
    references: [beneficiarios.id],
  }),
  bundle: one(bundles, {
    fields: [purchases.bundleId],
    references: [bundles.id],
  }),
  organization: one(organizations, {
    fields: [purchases.organizationId],
    references: [organizations.id],
  }),
  items: many(purchaseItems),
  payments: many(payments),
  paymentPlans: many(paymentPlans),
  certificates: many(certificates),
}))

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

export const paymentsRelations = relations(payments, ({ one }) => ({
  purchase: one(purchases, {
    fields: [payments.purchaseId],
    references: [purchases.id],
  }),
}))

// Payment plans table
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

export const paymentPlansRelations = relations(paymentPlans, ({ one }) => ({
  purchase: one(purchases, {
    fields: [paymentPlans.purchaseId],
    references: [purchases.id],
  }),
}))

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

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  item: one(inventoryItems, {
    fields: [purchaseItems.itemId],
    references: [inventoryItems.id],
  }),
}))

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

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [organizationMembers.clientId],
    references: [clients.id],
  }),
}))

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

export const inventoryPurchasesRelations = relations(inventoryPurchases, ({ many }) => ({
  items: many(inventoryPurchaseItems),
}))

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

// Sales table for tracking item sales
export const sales = pgTable("sales", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  orderReference: varchar("order_reference", { length: 100 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const salesRelations = relations(sales, ({ many }) => ({
  items: many(saleItems),
}))

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