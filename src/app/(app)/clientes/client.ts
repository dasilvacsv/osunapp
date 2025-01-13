// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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