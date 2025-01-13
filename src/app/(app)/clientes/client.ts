// app/actions/clients.ts
"use server"
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ClientFormData = {
  name: string;
  contactInfo: {
    email: string;
    phone?: string;
  };
  organizationId?: string;
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL";
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
    await db.insert(clients).values({
      name: data.name,
      contactInfo: data.contactInfo,
      organizationId: data.organizationId,
      role: data.role,
    });
    
    // Revalidate multiple paths if needed
    revalidatePath("/clientes");
    return { success: "Client created successfully" };
  } catch (error) {
    return { error: "Failed to create client" };
  }
}

export async function updateClient(id: string, data: ClientFormData) {
  try {
    await db.update(clients)
      .set({
        name: data.name,
        contactInfo: data.contactInfo,
        organizationId: data.organizationId,
        role: data.role,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));
    
    revalidatePath("/clientes");
    return { success: "Client updated successfully" };
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