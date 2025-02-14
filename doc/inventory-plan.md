# Inventory & Bundle Management System Development Plan

## 1. System Overview
The system will handle two types of inventory tracking:
- Real stock (physical inventory)
- Pre-sale reservations (needed/planned inventory)

## 2. Database Structure
We have already implemented the necessary schema changes:
- `inventoryItems` table with `currentStock` and `reservedStock`
- `inventoryTransactions` table for tracking all stock movements
- `bundles` and `bundleItems` for package management

### Schema Definitions
```typescript
// src/db/schema.ts
import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm';

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  currentStock: integer("current_stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // e.g., 'IN', 'OUT'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bundles = pgTable("bundles", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

## 3. Implementation Phases

### Phase 1: Core Inventory Management (Week 1)
- [ ] Basic CRUD operations for inventory items
  - Create inventory item
  - Update inventory details
  - Delete/deactivate items
  - List and search functionality
- [ ] Stock movement operations
  - Stock-in process
  - Stock-out process
  - Stock adjustment
  - Transaction logging
- [ ] Inventory validation
  - Stock level checks
  - Minimum stock alerts
  - Expected restock tracking

### Phase 2: Bundle System (Week 2)
- [ ] Bundle Management
  - Bundle creation with multiple items
  - Bundle editing and status management
  - Bundle inventory requirements calculation
- [ ] Stock Reservation System
  - Pre-sale stock reservation
  - Bundle stock validation
  - Reserved stock tracking
- [ ] Bundle Fulfillment
  - Stock availability checks
  - Automatic stock deduction
  - Fulfillment status tracking

### Phase 3: Pre-sale System (Week 3)
- [ ] Pre-sale Management
  - Pre-sale order creation
  - Stock reservation for pre-sales
  - Required inventory calculation
- [ ] Inventory Planning
  - Expected inventory needs
  - Restock recommendations
  - Pre-sale vs actual stock reporting
- [ ] Alert System
  - Low stock alerts
  - Reservation conflicts
  - Restock reminders

### Phase 4: UI Implementation (Week 4)
- [ ] Inventory Dashboard
  - Current stock levels
  - Reserved stock overview
  - Transaction history
- [ ] Bundle Management Interface
  - Bundle creator/editor
  - Bundle status viewer
  - Fulfillment tracker
- [ ] Reports and Analytics
  - Stock level reports
  - Pre-sale demand analysis
  - Bundle performance metrics

## 4. API Endpoints

### Inventory Management
```typescript
// src/features/inventory/actions.ts
'use server'

import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";

// Inventory Items
export async function createInventoryItem(data) {
  // Implementation...
}

export async function getInventoryItems() {
  // Implementation...
}

// Stock Operations
export async function stockIn(itemId, quantity) {
  // Implementation...
}
```

### Bundle Management
```typescript
// src/features/bundles/actions.ts
'use server'

import { db } from "@/db";
import { bundles } from "@/db/schema";

// Bundle Operations
export async function createBundle(data) {
  // Implementation...
}

export async function getBundles() {
  // Implementation...
}
```

## 5. Core Business Logic

### Stock Management Rules
- Current stock cannot go below 0
- Reserved stock cannot exceed current stock
- Each stock movement must be logged
- Pre-sales should automatically reserve stock

### Bundle Management Rules
- Bundles must have at least one item
- Bundle creation requires stock validation
- Stock is reserved when bundle is purchased
- Stock is deducted when bundle is fulfilled

## 6. Required Components

### Server Components
```typescript
// Components to implement
- InventoryManager
- BundleManager
- StockReservationService
- InventoryTransactionLogger
- AlertService
```

### UI Components
```typescript
// Pages/components to create
- InventoryDashboard
- BundleCreator
- StockMovementForm
- InventoryAlerts
- TransactionHistory
```

## 7. Testing Strategy

### Unit Tests
- Stock movement calculations
- Bundle validation
- Reservation logic
- Transaction logging

### Integration Tests
- Complete purchase flow
- Bundle fulfillment process
- Pre-sale reservation system
- Stock adjustment procedures

### End-to-End Tests
- Full bundle creation and fulfillment
- Complete pre-sale process
- Inventory management workflows

## 8. Monitoring and Maintenance

### Monitoring
- Stock level alerts
- Transaction logging
- Error tracking
- Performance metrics

### Maintenance
- Regular stock reconciliation
- Data cleanup procedures
- Performance optimization
- System health checks 