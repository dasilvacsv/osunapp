"use server"

import { db } from "@/db";
import { and, eq, sql, inArray, SQL, desc } from "drizzle-orm";
import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  purchaseItems,
  bundles
} from "@/db/schema";
import { 
  CertificadoSale, 
  OrganizationSalesGroup, 
  CertificadoResponse,
  PurchaseStatus,
  PaymentStatus
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
        
        // Bundle info
        bundleId: purchases.bundleId,
        bundleName: bundles.name,
        
        // Organization info
        organizationId: purchases.organizationId,
        organizationName: organizations.name,
        organizationType: organizations.type,
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