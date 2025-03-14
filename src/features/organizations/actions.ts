"use server"

import { db } from "@/db"
import { organizations, organizationSections } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Section, SectionFormData } from "@/lib/types"
import { unstable_noStore as noStore } from "next/cache"
import { revalidatePath } from "next/cache"

export type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export async function getOrganizations(): Promise<ActionResponse> {
  noStore()
  try {
    const data = await db.select().from(organizations).where(eq(organizations.status, "ACTIVE"))
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch organizations" }
  }
}

export async function getOrganizationSections(organizationId: string): Promise<ActionResponse> {
  noStore()
  try {
    const data = await db
      .select()
      .from(organizationSections)
      .where(eq(organizationSections.organizationId, organizationId))
      .orderBy(organizationSections.createdAt)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting organization sections:", error)
    return { success: false, error: "Failed to get organization sections" }
  }
}

export async function createOrganization(data: any): Promise<ActionResponse> {
  try {
    const [organization] = await db.insert(organizations).values(data).returning()
    return { success: true, data: organization }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create organization" }
  }
}

export async function updateOrganization(id: string, data: any): Promise<ActionResponse> {
  try {
    const [organization] = await db
      .update(organizations)
      .set(data)
      .where(eq(organizations.id, id))
      .returning()
    return { success: true, data: organization }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update organization" }
  }
}

export async function deleteOrganization(id: string): Promise<ActionResponse> {
  try {
    await db.delete(organizations).where(eq(organizations.id, id))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete organization" }
  }
}

export async function createOrganizationSection(organizationId: string, data: SectionFormData) {
  try {
    const [section] = await db.insert(organizationSections).values({
      ...data,
      organizationId,
    }).returning()

    return { success: true, data: section }
  } catch (error) {
    console.error("Error creating organization section:", error)
    return { success: false, error: "Failed to create organization section" }
  }
}

export async function updateOrganizationSection(id: string, data: SectionFormData) {
  try {
    const [section] = await db
      .update(organizationSections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizationSections.id, id))
      .returning()

    return { success: true, data: section }
  } catch (error) {
    console.error("Error updating organization section:", error)
    return { success: false, error: "Failed to update organization section" }
  }
}

export async function deleteOrganizationSection(id: string) {
  try {
    await db.delete(organizationSections).where(eq(organizationSections.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error deleting organization section:", error)
    return { success: false, error: "Failed to delete organization section" }
  }
} 