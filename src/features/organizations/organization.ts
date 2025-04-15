import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { organizations, organizationSections, clients, beneficiarios } from "@/db/schema";

export type OrganizationFormData = {
  name: string;
  type: "SCHOOL" | "COMPANY" | "OTHER";
  nature: "PUBLIC" | "PRIVATE";
  address?: string;
  cityId?: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
};

export type OrganizationSectionFormData = {
  name: string;
  level: string;
  templateLink?: string;
  templateStatus: "COMPLETE" | "INCOMPLETE" | "PENDING";
};

export async function getOrganizations() {
  try {
    const data = await db
      .select()
      .from(organizations)
      .where(eq(organizations.status, "ACTIVE"));

    // Fetch related data for each organization
    const enrichedData = await Promise.all(
      data.map(async (org) => {
        const sections = await db
          .select()
          .from(organizationSections)
          .where(
            and(
              eq(organizationSections.organizationId, org.id),
              eq(organizationSections.status, "ACTIVE")
            )
          );

        const orgClients = await db
          .select()
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, org.id),
              eq(clients.status, "ACTIVE")
            )
          );

        const clientsWithBeneficiaries = await Promise.all(
          orgClients.map(async (client) => {
            const beneficiariosList = await db
              .select()
              .from(beneficiarios)
              .where(
                and(
                  eq(beneficiarios.clientId, client.id),
                  eq(beneficiarios.status, "ACTIVE")
                )
              );

            return {
              ...client,
              beneficiarios: beneficiariosList,
            };
          })
        );

        return {
          ...org,
          sections,
          clients: clientsWithBeneficiaries,
        };
      })
    );

    return { data: enrichedData };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return { error: "Failed to fetch organizations" };
  }
}

export async function getOrganization(id: string) {
  try {
    const data = await db.select().from(organizations).where(eq(organizations.id, id));
    return { data: data[0] };
  } catch (error) {
    return { error: "Failed to fetch organization" };
  }
}

export async function createOrganization(data: OrganizationFormData) {
  try {
    const newOrganization = await db
      .insert(organizations)
      .values({
        name: data.name,
        type: data.type,
        address: data.address,
        contactInfo: data.contactInfo,
        status: "ACTIVE",
        nature: data.nature,
        cityId: data.cityId,
      })
      .returning();

    revalidatePath("/organizations");
    return { success: true, data: newOrganization[0] };
  } catch (error) {
    return { error: "Failed to create organization" };
  }
}

export async function updateOrganization(id: string, data: OrganizationFormData) {
  try {
    const updatedOrganization = await db
      .update(organizations)
      .set({
        name: data.name,
        type: data.type,
        address: data.address,
        contactInfo: data.contactInfo,
        updatedAt: new Date(),
        nature: data.nature,
        cityId: data.cityId,
      })
      .where(eq(organizations.id, id))
      .returning();

    revalidatePath("/organizations");
    return { success: true, data: updatedOrganization[0] };
  } catch (error) {
    return { error: "Failed to update organization" };
  }
}

export async function deleteOrganization(id: string) {
  try {
    await db
      .update(organizations)
      .set({
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id));

    revalidatePath("/organizations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete organization" };
  }
}

export async function getOrganizationSections(organizationId: string) {
  try {
    const data = await db
      .select()
      .from(organizationSections)
      .where(
        and(
          eq(organizationSections.organizationId, organizationId),
          eq(organizationSections.status, "ACTIVE")
        )
      );
    return { data };
  } catch (error) {
    return { error: "Failed to fetch organization sections" };
  }
}

export async function createOrganizationSection(
  organizationId: string,
  data: OrganizationSectionFormData
) {
  try {
    const newSection = await db
      .insert(organizationSections)
      .values({
        name: data.name,
        level: data.level,
        organizationId,
        templateLink: data.templateLink || null,
        templateStatus: data.templateStatus,
        status: "ACTIVE",
      })
      .returning();

    revalidatePath("/organizations");
    return { success: true, data: newSection[0] };
  } catch (error) {
    return { error: "Failed to create organization section" };
  }
}

export async function updateOrganizationSection(
  id: string,
  data: OrganizationSectionFormData
) {
  try {
    const updatedSection = await db
      .update(organizationSections)
      .set({
        name: data.name,
        level: data.level,
        templateLink: data.templateLink || null,
        templateStatus: data.templateStatus,
        updatedAt: new Date(),
      })
      .where(eq(organizationSections.id, id))
      .returning();

    revalidatePath("/organizations");
    return { success: true, data: updatedSection[0] };
  } catch (error) {
    return { error: "Failed to update organization section" };
  }
}

export async function deleteOrganizationSection(id: string) {
  try {
    await db
      .update(organizationSections)
      .set({
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(organizationSections.id, id));

    revalidatePath("/organizations");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete organization section" };
  }
}