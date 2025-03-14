"use server"

import { db } from "@/db";
import { and, eq, sql, inArray, SQL, desc } from "drizzle-orm";
import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  purchaseItems,
  bundles,
  certificates
} from "@/db/schema";
import { 
  CertificadoSale, 
  OrganizationSalesGroup, 
  CertificadoResponse,
  PurchaseStatus,
  PaymentStatus,
  CertificateStatus
} from "./types";

export async function getCertificadoSales(): Promise<CertificadoResponse> {
  try {
    // First, get all purchases with necessary related data
    const salesData = await db
      .select({
        // Purchase info
        id: purchases.id,
        purchaseDate: purchases.purchaseDate,
        totalAmount: purchases.totalAmount,
        status: purchases.status,
        paymentStatus: purchases.paymentStatus,
        isPaid: purchases.isPaid,
        
        // Client info
        clientId: purchases.clientId,
        clientName: clients.name,
        
        // Beneficiary info
        beneficiarioId: purchases.beneficiarioId,
        beneficiarioFirstName: beneficiarios.firstName,
        beneficiarioLastName: beneficiarios.lastName,
        beneficiarioGrade: beneficiarios.grade,
        beneficiarioSection: beneficiarios.section,
        
        // Bundle info
        bundleId: purchases.bundleId,
        bundleName: bundles.name,
        
        // Organization info
        organizationId: purchases.organizationId,
        organizationName: organizations.name,
        organizationType: organizations.type,
        
        // Certificate info
        certificateId: certificates.id,
        certificateStatus: certificates.status,
        certificateFileUrl: certificates.fileUrl,
      })
      .from(purchases)
      // Join with clients (required)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      // Join with beneficiarios (optional)
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      // Join with bundles (optional)
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      // Join with organizations (optional)
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      // Join with certificates (optional)
      .leftJoin(certificates, eq(purchases.id, certificates.purchaseId))
      // Order by most recent first
      .orderBy(desc(purchases.purchaseDate));
    
    // Get all unique organization IDs for additional org data if needed
    const organizationIds = [...new Set(
      salesData
        .filter(sale => sale.organizationId !== null)
        .map(sale => sale.organizationId)
    )] as string[];
    
    // Group sales by organization (similar to the bundles approach)
    const organizedSales: Record<string, OrganizationSalesGroup> = {};
    const noOrgGroup: OrganizationSalesGroup = {
      id: null,
      name: "Ventas Generales",
      type: null,
      sales: [],
      totalSales: 0,
      totalAmount: 0
    };
    
    // Populate groups with sales
    salesData.forEach(sale => {
      if (!sale.organizationId) {
        noOrgGroup.sales.push(sale as CertificadoSale);
        noOrgGroup.totalSales++;
        noOrgGroup.totalAmount += Number(sale.totalAmount || 0);
        return;
      }
      
      const orgId = sale.organizationId;
      if (!organizedSales[orgId]) {
        organizedSales[orgId] = {
          id: orgId,
          name: sale.organizationName,
          type: sale.organizationType,
          sales: [],
          totalSales: 0,
          totalAmount: 0
        };
      }
      
      organizedSales[orgId].sales.push(sale as CertificadoSale);
      organizedSales[orgId].totalSales++;
      organizedSales[orgId].totalAmount += Number(sale.totalAmount || 0);
    });
    
    // Convert to array and sort by organization name
    const sortedGroups = Object.values(organizedSales).sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    
    // Add the "No Organization" group at the end if it has sales
    if (noOrgGroup.sales.length > 0) {
      sortedGroups.push(noOrgGroup);
    }
    
    return { 
      success: true, 
      data: sortedGroups 
    };
  } catch (error) {
    console.error("Error fetching certificado sales:", error);
    return { 
      success: false, 
      error: "Failed to fetch sales data" 
    };
  }
}

// Add a new action to update certificate status
export async function updateCertificateStatus(
  purchaseId: string,
  status: CertificateStatus,
  fileUrl?: string,
  notes?: string
) {
  try {
    // Check if a certificate record already exists for this purchase
    const existingCertificate = await db
      .select()
      .from(certificates)
      .where(eq(certificates.purchaseId, purchaseId))
      .limit(1);

    if (existingCertificate.length > 0) {
      // Update existing certificate
      const updatedCertificate = await db
        .update(certificates)
        .set({
          status,
          fileUrl: fileUrl || existingCertificate[0].fileUrl,
          notes: notes || existingCertificate[0].notes,
          ...(status === "GENERATED" ? { generatedAt: new Date() } : {}),
          ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(eq(certificates.id, existingCertificate[0].id))
        .returning();

      return { success: true, data: updatedCertificate[0] };
    } else {
      // Get the beneficiario ID from the purchase
      const purchase = await db
        .select({ beneficiarioId: purchases.beneficiarioId })
        .from(purchases)
        .where(eq(purchases.id, purchaseId))
        .limit(1);

      // Create a new certificate
      const newCertificate = await db
        .insert(certificates)
        .values({
          purchaseId,
          beneficiarioId: purchase.length > 0 ? purchase[0].beneficiarioId : null,
          status,
          fileUrl,
          notes,
          ...(status === "GENERATED" ? { generatedAt: new Date() } : {}),
          ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
        })
        .returning();

      return { success: true, data: newCertificate[0] };
    }
  } catch (error) {
    console.error("Error updating certificate status:", error);
    return { success: false, error: "Failed to update certificate status" };
  }
} 