// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { and, eq, sql } from "drizzle-orm";
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
    let query = db.select({
      client: clients,
      organization: organizations
    })
    .from(clients)
    .leftJoin(organizations, eq(clients.organizationId, organizations.id))

    if (organizationId) {
      query = query.where(eq(clients.organizationId, organizationId))
    }

    const data = await query
    
    return { 
      data: data.map(row => ({
        ...row.client,
        organization: row.organization
      })) 
    };
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

export async function getOrganizations() {
  try {
    const data = await db.select().from(organizations).where(eq(organizations.status, "ACTIVE"));
    return { data };
  } catch (error) {
    return { error: "Failed to fetch organizations" };
  }
}

export async function createOrganization(data: OrganizationFormData) {
  try {
    const newOrganization = await db.insert(organizations).values({
      name: data.name,
      type: data.type,
      address: data.address,
      contactInfo: data.contactInfo,
      status: "ACTIVE",
    }).returning();
    revalidatePath("/clientes");
    return { success: "Organization created successfully", data: newOrganization[0] };
  } catch (error) {
    return { error: "Failed to create organization" };
  }
}

export async function searchClients(query: string) {
  try {
    const data = await db.select()
      .from(clients)
      .where(sql`LOWER(${clients.name}) LIKE ${'%' + query.toLowerCase() + '%'}`)
      .limit(10)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Error buscando clientes" }
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
    }).returning();
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

    // Get client's beneficiaries
    const beneficiariesData = await db
      .select()
      .from(beneficiarios)
      .where(eq(beneficiarios.clientId, id));

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
      children: beneficiariesData,
      purchases: purchasesWithItems,
      organizationMemberships: memberships,
    };

    return { data: response };
  } catch (error) {
    console.error("Error fetching detailed client data:", error);
    return { error: "Failed to fetch client details" };
  }
}

export async function getBeneficiariesByClient(clientId: string) {
  try {
    const data = await db
      .select({
        beneficiary: beneficiarios,
        organization: organizations,
      })
      .from(beneficiarios)
      .leftJoin(organizations, eq(beneficiarios.organizationId, organizations.id))
      .where(eq(beneficiarios.clientId, clientId));
    
    // Map the data to match the Beneficiary type
    const mappedData = data.map(row => ({
      ...row.beneficiary,
      status: row.beneficiary.status as "ACTIVE" | "INACTIVE", // Ensure status is never null
      organization: row.organization || undefined, // Convert null to undefined
    }));
    
    return { 
      success: true, 
      data: mappedData
    };
  } catch (error) {
    console.error("Error fetching beneficiaries:", error);
    return { success: false, error: "Error al obtener beneficiarios" };
  }
}

export async function getBeneficiary(id: string) {
  try {
    const data = await db
      .select()
      .from(beneficiarios)
      .where(eq(beneficiarios.id, id));
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    return { success: false, error: "Error al obtener el beneficiario" };
  }
}

export async function createBeneficiary(data: BeneficiaryFormData) {
  try {
    const newBeneficiary = await db
      .insert(beneficiarios)
      .values({
        clientId: data.clientId,
        organizationId: data.organizationId === 'none' ? null : data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        grade: data.grade,
        section: data.section,
        school: data.school,
        level: data.level,
        bundleId: data.bundleId,
        status: "ACTIVE",
      })
      .returning();

    // Revalidate both clients and sales paths
    revalidatePath("/clientes")
    revalidatePath("/sales")
    revalidatePath("/sales/new")
    
    return { success: true, data: newBeneficiary[0] }
  } catch (error) {
    console.error("Error creating beneficiary:", error)
    return { success: false, error: "Failed to create beneficiary" }
  }
}

export async function updateBeneficiary(id: string, data: BeneficiaryFormData) {
  try {
    const updatedBeneficiary = await db
      .update(beneficiarios)
      .set({
        name: data.name,
        organizationId: data.organizationId === 'none' ? null : data.organizationId,
        grade: data.grade,
        section: data.section,
        firstName: data.firstName,
        lastName: data.lastName,
        school: data.school,
        level: data.level,
        bundleId: data.bundleId,
        updatedAt: new Date(),
      })
      .where(eq(beneficiarios.id, id))
      .returning();
    
    revalidatePath("/clientes");
    return { success: true, data: updatedBeneficiary[0] };
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    return { success: false, error: "Error al actualizar el beneficiario" };
  }
}

export async function deleteBeneficiary(id: string) {
  try {
    await db
      .update(beneficiarios)
      .set({ 
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(beneficiarios.id, id));
    
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    return { success: false, error: "Error al eliminar el beneficiario" };
  }
}