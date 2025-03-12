// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { and, eq, sql, inArray, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  purchaseItems,
  organizationMembers,
  bundles,
  inventoryItems
} from "@/db/schema";

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
  children?: (typeof beneficiarios.$inferSelect)[];
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

export type OrganizationFormData = {
  name: string;
  type: "SCHOOL" | "COMPANY" | "OTHER";
  address?: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
};

export type BeneficiaryFormData = {
  name: string;
  clientId: string;
  organizationId?: string;
  grade?: string;
  section?: string;
  firstName?: string;
  lastName?: string;
  school?: string;
  level?: string;
  bundleId?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function getClients(organizationId?: string) {
  try {
    // Prepare the conditions
    const conditions: SQL[] = [];
    if (organizationId) {
      conditions.push(eq(clients.organizationId, organizationId));
    }
    
    // Get all clients with the condition if specified
    const clientsData = await db.select().from(clients)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const clientIds = clientsData.map(client => client.id);
    
    // If no clients found, return early
    if (clientIds.length === 0) {
      return { data: [] };
    }
    
    // Get organizations for these clients that have an organization
    const organizationIds = clientsData
      .filter(c => c.organizationId)
      .map(c => c.organizationId as string);
      
    const organizations_data = organizationIds.length > 0 
      ? await db.select().from(organizations)
          .where(inArray(organizations.id, organizationIds))
      : [];
    
    // Get beneficiarios for these clients
    const beneficiarios_data = await db.select().from(beneficiarios)
      .where(inArray(beneficiarios.clientId, clientIds));
    
    // Map organizations and beneficiarios to clients
    const result = clientsData.map(client => {
      // Find the organization for this client
      const organization = client.organizationId 
        ? organizations_data.find(org => org.id === client.organizationId) 
        : undefined;
      
      // Find all beneficiarios for this client
      const clientBeneficiarios = beneficiarios_data.filter(ben => ben.clientId === client.id);
      
      return {
        ...client,
        organization,
        beneficiarios: clientBeneficiarios
      };
    });
    
    return { data: result };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { error: "Failed to fetch clients" };
  }
}

export async function getOrganizations() {
  try {
    const data = await db.select().from(organizations)
      .where(eq(organizations.status, "ACTIVE"));
    return { data };
  } catch (error) {
    return { error: "Failed to fetch organizations" };
  }
}

export async function getClientDetail(clientId: string): Promise<{data?: DetailedClientResponse, error?: string}> {
  try {
    // Get client
    const clientResult = await db.select().from(clients)
      .where(eq(clients.id, clientId));
    
    if (!clientResult || clientResult.length === 0) {
      return { error: "Client not found" };
    }
    
    const client = clientResult[0];
    
    // Get organization if it exists
    let organization: typeof organizations.$inferSelect | undefined;
    if (client.organizationId) {
      const orgResult = await db.select().from(organizations)
        .where(eq(organizations.id, client.organizationId));
      organization = orgResult.length > 0 ? orgResult[0] : undefined;
    }
    
    // Get beneficiarios
    const beneficiariosData = await db.select().from(beneficiarios)
      .where(eq(beneficiarios.clientId, clientId));
    
    // Get memberships with their organizations
    const membershipRows = await db.select().from(organizationMembers)
      .where(eq(organizationMembers.clientId, clientId));
    
    let organizationMemberships: {
      membership: typeof organizationMembers.$inferSelect;
      organization: typeof organizations.$inferSelect;
    }[] = [];
    
    if (membershipRows.length > 0) {
      const membershipOrgIds = membershipRows.map(m => m.organizationId);
      const membershipOrgs = await db.select().from(organizations)
        .where(inArray(organizations.id, membershipOrgIds));
      
      organizationMemberships = membershipRows.map(membership => {
        const org = membershipOrgs.find(o => o.id === membership.organizationId);
        if (!org) return null;
        return {
          membership,
          organization: org
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);
    }
    
    // Get purchases
    const purchasesRows = await db.select().from(purchases)
      .where(eq(purchases.clientId, clientId));
    
    let clientPurchases: {
      purchase: typeof purchases.$inferSelect;
      items: {
        item: typeof purchaseItems.$inferSelect;
        inventoryItem: typeof inventoryItems.$inferSelect;
      }[];
      bundle?: typeof bundles.$inferSelect;
    }[] = [];
    
    if (purchasesRows.length > 0) {
      const purchaseIds = purchasesRows.map(p => p.id);
      
      // Get bundles for these purchases
      const purchaseBundleIds = purchasesRows
        .filter(p => p.bundleId !== null)
        .map(p => p.bundleId as string);
      
      const bundlesData = purchaseBundleIds.length > 0 
        ? await db.select().from(bundles).where(inArray(bundles.id, purchaseBundleIds)) 
        : [];
      
      // Get purchase items
      const purchaseItemsRows = await db.select().from(purchaseItems)
        .where(inArray(purchaseItems.purchaseId, purchaseIds));
      
      // Get inventory items for these purchase items
      const inventoryItemIds = purchaseItemsRows.map(pi => pi.itemId);
      const inventoryItemsData = inventoryItemIds.length > 0
        ? await db.select().from(inventoryItems).where(inArray(inventoryItems.id, inventoryItemIds))
        : [];
      
      // Build the purchases object
      clientPurchases = purchasesRows.map(purchase => {
        const bundle = purchase.bundleId 
          ? bundlesData.find(b => b.id === purchase.bundleId) 
          : undefined;
          
        const purchaseItemsList = purchaseItemsRows
          .filter(pi => pi.purchaseId === purchase.id);
          
        const items = purchaseItemsList.map(item => {
          const inventoryItem = inventoryItemsData.find(ii => ii.id === item.itemId);
          if (!inventoryItem) return null;
          return { item, inventoryItem };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
        
        return {
          purchase,
          items,
          bundle
        };
      });
    }
    
    // Structure the detailed response
    const detailedClient: DetailedClientResponse = {
      client,
      organization,
      children: beneficiariosData,
      organizationMemberships,
      purchases: clientPurchases
    };
    
    return { data: detailedClient };
  } catch (error) {
    console.error("Error fetching client details:", error);
    return { error: "Failed to fetch client details" };
  }
}

export async function getClient(id: string) {
  try {
    const data = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    
    return { data: data[0] };
  } catch (error) {
    return { error: "Failed to fetch client" };
  }
}

export async function getClientsByOrganization(organizationId: string) {
  try {
    const data = await db
      .select()
      .from(clients)
      .where(
        eq(clients.organizationId, organizationId)
      );
    
    return { data };
  } catch (error) {
    return { error: "Failed to fetch clients" };
  }
}

export async function getOrganization(id: string) {
  try {
    const data = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    
    return { data: data[0] };
  } catch (error) {
    return { error: "Failed to fetch organization" };
  }
}



