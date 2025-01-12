
import { db } from '.';
import { 
  organizations,
  clients,
  children,
  inventoryItems,
  bundles,
  bundleItems,
  purchases,
  purchaseItems,
  organizationMembers
} from './schema';



async function seed() {
  // Create Organizations
  const orgs = await db.insert(organizations).values([
    {
      name: "Saint Mary's School",
      type: "SCHOOL",
      address: "123 Education St",
      contactInfo: { phone: "555-0101", email: "contact@stmarys.edu" },
      status: "ACTIVE"
    },
    {
      name: "Tech Corp Inc",
      type: "COMPANY",
      address: "456 Business Ave",
      contactInfo: { phone: "555-0102", email: "info@techcorp.com" },
      status: "ACTIVE"
    }
  ]).returning();

  // Create Clients
  const clients = await db.insert(clients).values([
    {
      name: "John Smith",
      contactInfo: { phone: "555-0201", email: "john@email.com" },
      organizationId: orgs[0].id,
      role: "PARENT",
      status: "ACTIVE"
    },
    {
      name: "Sarah Johnson",
      contactInfo: { phone: "555-0202", email: "sarah@email.com" },
      organizationId: orgs[1].id,
      role: "EMPLOYEE",
      status: "ACTIVE"
    }
  ]).returning();

  // Create Children
  const children = await db.insert(children).values([
    {
      name: "Tommy Smith",
      clientId: clients[0].id,
      organizationId: orgs[0].id,
      grade: "5th",
      section: "A",
      status: "ACTIVE"
    },
    {
      name: "Jenny Smith",
      clientId: clients[0].id,
      organizationId: orgs[0].id,
      grade: "3rd",
      section: "B",
      status: "ACTIVE"
    }
  ]).returning();

  // Create Inventory Items
  const items = await db.insert(inventoryItems).values([
    {
      name: "Standard Photo Package",
      description: "4 poses, digital format",
      type: "DIGITAL",
      basePrice: 29.99,
      currentStock: null,
      minimumStock: null,
      status: "ACTIVE"
    },
    {
      name: "Gold Medal",
      description: "Commemorative medal",
      type: "PHYSICAL",
      basePrice: 15.99,
      currentStock: 100,
      minimumStock: 20,
      status: "ACTIVE"
    },
    {
      name: "Photo Print Pack",
      description: "Set of printed photos",
      type: "PHYSICAL",
      basePrice: 19.99,
      currentStock: 50,
      minimumStock: 10,
      status: "ACTIVE"
    }
  ]).returning();

  // Create Bundles
  const bundles = await db.insert(bundles).values([
    {
      name: "School Photo Day Special",
      description: "Complete package with photos and medal",
      type: "SCHOOL_PACKAGE",
      organizationId: orgs[0].id,
      basePrice: 49.99,
      discountPercentage: 10.00,
      status: "ACTIVE"
    },
    {
      name: "Corporate Headshot Package",
      description: "Professional headshots",
      type: "ORGANIZATION_PACKAGE",
      organizationId: orgs[1].id,
      basePrice: 79.99,
      discountPercentage: 0,
      status: "ACTIVE"
    }
  ]).returning();

  // Create Bundle Items
  await db.insert(bundleItems).values([
    {
      bundleId: bundles[0].id,
      itemId: items[0].id,
      quantity: 1,
      overridePrice: 24.99
    },
    {
      bundleId: bundles[0].id,
      itemId: items[1].id,
      quantity: 1,
      overridePrice: 12.99
    }
  ]);

  // Create Purchases
  const purchases = await db.insert(purchases).values([
    {
      clientId: clients[0].id,
      childId: children[0].id,
      bundleId: bundles[0].id,
      organizationId: orgs[0].id,
      status: "COMPLETED",
      totalAmount: 49.99,
      paymentStatus: "PAID",
      paymentMetadata: { method: "CREDIT_CARD", transactionId: "tx_123" }
    }
  ]).returning();

  // Create Purchase Items
  await db.insert(purchaseItems).values([
    {
      purchaseId: purchases[0].id,
      itemId: items[0].id,
      quantity: 1,
      unitPrice: 24.99,
      totalPrice: 24.99,
      metadata: { format: "DIGITAL", deliveryMethod: "EMAIL" }
    },
    {
      purchaseId: purchases[0].id,
      itemId: items[1].id,
      quantity: 1,
      unitPrice: 12.99,
      totalPrice: 12.99,
      metadata: { format: "PHYSICAL", deliveryMethod: "PICKUP" }
    }
  ]);

  // Create Organization Members
  await db.insert(organizationMembers).values([
    {
      organizationId: orgs[0].id,
      clientId: clients[0].id,
      role: "MEMBER",
      status: "ACTIVE"
    },
    {
      organizationId: orgs[1].id,
      clientId: clients[1].id,
      role: "ADMIN",
      status: "ACTIVE"
    }
  ]);

  console.log('Database seeded successfully!');
}

seed().catch(console.error);