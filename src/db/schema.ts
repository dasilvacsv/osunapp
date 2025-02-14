import {
  varchar,
  uuid,
  integer,
  text,
  pgTable,
  date,
  pgEnum,
  timestamp,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Enums
export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "SCHOOL",
  "COMPANY",
  "OTHER",
]);

export const clientRoleEnum = pgEnum("client_role", [
  "PARENT",
  "EMPLOYEE",
  "INDIVIDUAL",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
]);

export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "ADMIN",
  "MEMBER",
]);

export const itemTypeEnum = pgEnum("item_type", [
  "PHYSICAL",
  "DIGITAL",
  "SERVICE",
]);

export const bundleTypeEnum = pgEnum("bundle_type", [
  "SCHOOL_PACKAGE",
  "ORGANIZATION_PACKAGE",
  "REGULAR",
]);

export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN"]);

export const BORROW_STATUS_ENUM = pgEnum("borrow_status", [
  "BORROWED",
  "RETURNED",
]);

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
});

// Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", {length: 255}).unique(),
  phone: varchar("phone"),
  whatsapp: varchar("whatsapp"),
  contactInfo: jsonb("contact_info"), // Store phone, email, etc.
  organizationId: uuid("organization_id").references(() => organizations.id),
  role: clientRoleEnum("role").notNull(),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Children Table
export const children = pgTable("children", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  grade: varchar("grade", { length: 50 }),
  section: varchar("section", { length: 50 }),
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Inventory Items Table
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: itemTypeEnum("type").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0), // For pre-sales
  minimumStock: integer("minimum_stock"),
  expectedRestock: timestamp("expected_restock", { withTimezone: true }),
  metadata: jsonb("metadata"), // For additional item properties
  status: statusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// New table for inventory transactions
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull().references(() => inventoryItems.id),
  type: pgEnum("transaction_type", [
    "STOCK_IN",
    "STOCK_OUT",
    "RESERVE",
    "RESERVE_RELEASE",
    "ADJUSTMENT"
  ])("type").notNull(),
  quantity: integer("quantity").notNull(),
  reference: jsonb("reference"), // Store related purchase/bundle info
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

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
});

// Bundle Items Table (Connects Bundles with Inventory Items)
export const bundleItems = pgTable("bundle_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  bundleId: uuid("bundle_id").notNull().references(() => bundles.id),
  itemId: uuid("item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  overridePrice: decimal("override_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Purchases Table
export const purchases = pgTable("purchases", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  childId: uuid("child_id").references(() => children.id),
  bundleId: uuid("bundle_id").references(() => bundles.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  status: purchaseStatusEnum("status").default("PENDING"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status"),
  paymentMetadata: jsonb("payment_metadata"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  paymentMethod: varchar("payment_method")
});

// Purchase Items Table
export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  itemId: uuid("item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

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
});

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
});