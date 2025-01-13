// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { 
  clients, 
  organizations, 
  children, 
  purchases, 
  purchaseItems,
  organizationMembers,
  bundles,
  inventoryItems
} from "@/db/schema";

// app/actions/clients.ts
export type ClientFormData = {
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  contactInfo: {
    email: string;
    phone?: string;
  };
  organizationId?: string;
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL";
  status?: "ACTIVE" | "INACTIVE";
};

export type DetailedClientResponse = {
  client: typeof clients.$inferSelect;
  organization?: typeof organizations.$inferSelect;
  children?: (typeof children.$inferSelect)[];
  purchases?: {
    purchase: typeof purchases.$inferSelect;
    items: {
      item: typeof purchaseItems.$inferSelect;
      inventoryItem: typeof inventoryItems.$inferSelect;
    }[];
    bundle?: typeof bundles.$inferSelect;
  }[];
  organizationMemberships?: {
    membership: typeof organizationMembers.$inferSelect;
    organization: typeof organizations.$inferSelect;
  }[];
}

export async function getClients() {
  try {
    const data = await db.select().from(clients).where(
      eq(clients.status, "ACTIVE")
    );
    return { data };
  } catch (error) {
    return { error: "Failed to fetch clients" };
  }
}

export async function getClient(id: string) {
  try {
    const data = await db.select().from(clients).where(
      eq(clients.id, id)
    );
    return { data: data[0] };
  } catch (error) {
    return { error: "Failed to fetch client" };
  }
}

export async function createClient(data: ClientFormData) {
  try {
    const newClient = await db.insert(clients).values({
      name: data.name,
      document: data.document,
      phone: data.phone,
      whatsapp: data.whatsapp,
      contactInfo: data.contactInfo,
      organizationId: data.organizationId,
      role: data.role,
      status: "ACTIVE",
    })
    .returning();
    
    revalidatePath("/clientes");
    return { success: "Client created successfully", data: newClient[0] };
  } catch (error) {
    return { error: "Failed to create client" };
  }
}

export async function updateClient(id: string, data: ClientFormData) {
  try {
    const updatedClient = await db.update(clients)
      .set({
        name: data.name,
        document: data.document,
        phone: data.phone,
        whatsapp: data.whatsapp,
        contactInfo: data.contactInfo,
        organizationId: data.organizationId,
        role: data.role,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    
    revalidatePath("/clientes");
    return { success: "Client updated successfully", data: updatedClient[0] };
  } catch (error) {
    return { error: "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    await db.update(clients)
      .set({ 
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));
    
    revalidatePath("/clientes");
    return { success: "Client deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete client" };
  }
}

export async function getDetailedClient(id: string) {
  try {
    // Get client and their organization
    const clientData = await db
      .select({
        client: clients,
        organization: organizations,
      })
      .from(clients)
      .leftJoin(organizations, eq(clients.organizationId, organizations.id))
      .where(eq(clients.id, id))
      .limit(1);

    if (!clientData.length) {
      return { error: "Client not found" };
    }

    // Get client's children
    const childrenData = await db
      .select()
      .from(children)
      .where(eq(children.clientId, id));

    // Get client's purchases with items and bundles
    const purchasesData = await db
      .select({
        purchase: purchases,
        bundle: bundles,
      })
      .from(purchases)
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .where(eq(purchases.clientId, id));

    // Get purchase items for each purchase
    const purchasesWithItems = await Promise.all(
      purchasesData.map(async ({ purchase, bundle }) => {
        const items = await db
          .select({
            item: purchaseItems,
            inventoryItem: inventoryItems,
          })
          .from(purchaseItems)
          .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
          .where(eq(purchaseItems.purchaseId, purchase.id));

        return {
          purchase,
          items,
          bundle,
        };
      })
    );

    // Get organization memberships
    const memberships = await db
      .select({
        membership: organizationMembers,
        organization: organizations,
      })
      .from(organizationMembers)
      .leftJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(and(
        eq(organizationMembers.clientId, id),
        eq(organizationMembers.status, "ACTIVE")
      ));

    const response: DetailedClientResponse = {
      client: clientData[0].client,
      organization: clientData[0].organization || undefined,
      children: childrenData,
      purchases: purchasesWithItems,
      organizationMemberships: memberships,
    };

    return { data: response };
  } catch (error) {
    console.error("Error fetching detailed client data:", error);
    return { error: "Failed to fetch client details" };
  }
}