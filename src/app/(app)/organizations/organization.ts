"use server"

import { db } from "@/db"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { organizations } from "@/db/schema"

export type OrganizationFormData = {
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  address?: string
  contactInfo: {
    email?: string
    phone?: string
  }
}

export async function getOrganizations() {
  try {
    const data = await db.select().from(organizations).where(
      eq(organizations.status, "ACTIVE")
    )
    return { data }
  } catch (error) {
    return { error: "Failed to fetch organizations" }
  }
}

export async function getOrganization(id: string) {
  try {
    const data = await db.select().from(organizations).where(
      eq(organizations.id, id)
    )
    return { data: data[0] }
  } catch (error) {
    return { error: "Failed to fetch organization" }
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
    })
    .returning()
    
    revalidatePath("/organizations")
    return { success: "Organization created successfully", data: newOrganization[0] }
  } catch (error) {
    return { error: "Failed to create organization" }
  }
}

export async function updateOrganization(id: string, data: OrganizationFormData) {
  try {
    const updatedOrganization = await db.update(organizations)
      .set({
        name: data.name,
        type: data.type,
        address: data.address,
        contactInfo: data.contactInfo,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning()
    
    revalidatePath("/organizations")
    return { success: "Organization updated successfully", data: updatedOrganization[0] }
  } catch (error) {
    return { error: "Failed to update organization" }
  }
}

export async function deleteOrganization(id: string) {
  try {
    await db.update(organizations)
      .set({ 
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
    
    revalidatePath("/organizations")
    return { success: "Organization deleted successfully" }
  } catch (error) {
    return { error: "Failed to delete organization" }
  }
}