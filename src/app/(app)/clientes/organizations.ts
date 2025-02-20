// app/actions/organizations.ts
"use server"
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { organizations } from "@/db/schema";

export type OrganizationFormData = {
  name: string;
  type: "SCHOOL" | "COMPANY" | "OTHER";
  contactEmail?: string;
  phone?: string;
  address?: string;
};

export async function getOrganizations() {
  try {
    const data = await db.select().from(organizations);
    return { data };
  } catch (error) {
    return { error: "Failed to fetch organizations" };
  }
}

export async function createOrganization(data: OrganizationFormData) {
  try {
    const newOrg = await db.insert(organizations).values({
      name: data.name,
      type: data.type,
      contactEmail: data.contactEmail,
      phone: data.phone,
      address: data.address,
    }).returning();
    
    revalidatePath("/organizaciones");
    return { success: "Organization created successfully", data: newOrg[0] };
  } catch (error) {
    return { error: "Failed to create organization" };
  }
}

export async function updateOrganization(id: string, data: OrganizationFormData) {
  try {
    const updatedOrg = await db.update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    
    revalidatePath("/organizaciones");
    return { success: "Organization updated successfully", data: updatedOrg[0] };
  } catch (error) {
    return { error: "Failed to update organization" };
  }
}

export async function deleteOrganization(id: string) {
  try {
    await db.delete(organizations).where(eq(organizations.id, id));
    revalidatePath("/organizaciones");
    return { success: "Organization deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete organization" };
  }
}