"use server"
import { db } from "@/db"
import { eq } from "drizzle-orm"
import { organizations, clients } from "@/db/schema"

export type OrganizationWithClients = {
  id: string
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  address?: string
  contactInfo: {
    email?: string
    phone?: string
  }
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
  clients: {
    id: string
    name: string
    document: string
    phone?: string
    whatsapp?: string
    role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL"
    status: "ACTIVE" | "INACTIVE"
    createdAt: Date
    updatedAt: Date
  }[]
}

export async function getOrganizationsWithClients() {
  try {
    // Fetch organizations with their associated clients
    const data = await db
      .select({
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationType: organizations.type,
        organizationAddress: organizations.address,
        organizationContactInfo: organizations.contactInfo,
        organizationStatus: organizations.status,
        organizationCreatedAt: organizations.createdAt,
        organizationUpdatedAt: organizations.updatedAt,
        clientId: clients.id,
        clientName: clients.name,
        clientDocument: clients.document,
        clientPhone: clients.phone,
        clientWhatsapp: clients.whatsapp,
        clientRole: clients.role,
        clientStatus: clients.status,
        clientCreatedAt: clients.createdAt,
        clientUpdatedAt: clients.updatedAt,
      })
      .from(organizations)
      .leftJoin(clients, eq(organizations.id, clients.organizationId))
      .where(eq(organizations.status, "ACTIVE"))

      console.log("data", data);
      

    // Group clients by organization
    const groupedData: OrganizationWithClients[] = []
    data.forEach((row) => {
      // Find the organization in the grouped data
      let org = groupedData.find((o) => o.id === row.organizationId)
      if (!org) {
        // If the organization doesn't exist, create it
        org = {
          id: row.organizationId,
          name: row.organizationName,
          type: row.organizationType,
          address: row.organizationAddress,
          contactInfo: row.organizationContactInfo,
          status: row.organizationStatus,
          createdAt: row.organizationCreatedAt,
          updatedAt: row.organizationUpdatedAt,
          clients: [],
        }
        groupedData.push(org)
      }

      // Add the client to the organization's clients array (if the client exists)
      if (row.clientId) {
        org.clients.push({
          id: row.clientId,
          name: row.clientName,
          document: row.clientDocument,
          phone: row.clientPhone,
          whatsapp: row.clientWhatsapp,
          role: row.clientRole,
          status: row.clientStatus,
          createdAt: row.clientCreatedAt,
          updatedAt: row.clientUpdatedAt,
        })
      }
    })

    return { data: groupedData }
  } catch (error) {
    console.error("Error fetching organizations with clients:", error)
    return { error: "Failed to fetch organizations with clients" }
  }
}