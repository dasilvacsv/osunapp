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
  certificates,
  bundleItems,
  inventoryItems,
  payments
} from "@/db/schema";
import { 
  CertificadoSale, 
  OrganizationSalesGroup, 
  CertificadoResponse,
  PurchaseStatus,
  PaymentStatus,
  CertificateStatus,
  FichaData
} from "./types";
import * as XLSX from "xlsx";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

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

// Get complete data for a "Ficha" PDF
export async function getFichaData(purchaseId: string): Promise<{ success: boolean; data?: FichaData; error?: string }> {
  try {
    // Get purchase with related data
    const purchaseData = await db
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
        clientDocument: clients.document,
        clientPhone: clients.phone,
        clientWhatsapp: clients.whatsapp,
        clientContactInfo: clients.contactInfo,
        
        // Beneficiary info
        beneficiarioId: purchases.beneficiarioId,
        beneficiarioFirstName: beneficiarios.firstName,
        beneficiarioLastName: beneficiarios.lastName,
        beneficiarioGrade: beneficiarios.grade,
        beneficiarioSection: beneficiarios.section,
        beneficiarioSchool: beneficiarios.school,
        
        // Bundle info
        bundleId: purchases.bundleId,
        bundleName: bundles.name,
        bundleBasePrice: bundles.basePrice,
        bundlePrice: bundles.bundlePrice,
        
        // Organization info
        organizationId: purchases.organizationId,
        organizationName: organizations.name,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (purchaseData.length === 0) {
      return { success: false, error: "Purchase not found" };
    }

    // Get bundle items
    const bundleItemsData = purchaseData[0].bundleId 
      ? await db
          .select({
            itemName: inventoryItems.name,
            itemDescription: inventoryItems.description,
            quantity: bundleItems.quantity,
          })
          .from(bundleItems)
          .leftJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
          .where(eq(bundleItems.bundleId, purchaseData[0].bundleId as string))
      : [];

    // Get payment data
    const paymentsData = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        method: payments.paymentMethod,
        status: payments.status,
      })
      .from(payments)
      .where(eq(payments.purchaseId, purchaseId))
      .orderBy(desc(payments.paymentDate));

    // Calculate total paid amount
    const totalPaid = paymentsData.reduce((sum, payment) => 
      sum + Number(payment.amount), 0);
    
    // Calculate remaining amount
    const remaining = Number(purchaseData[0].totalAmount) - totalPaid;

    const fichaData: FichaData = {
      // Purchase info
      purchaseId: purchaseData[0].id,
      purchaseDate: purchaseData[0].purchaseDate,
      totalAmount: Number(purchaseData[0].totalAmount),
      status: purchaseData[0].status,
      isPaid: purchaseData[0].isPaid ?? false,
      
      // Client info
      clientName: purchaseData[0].clientName ?? "",
      clientDocument: purchaseData[0].clientDocument ?? "",
      clientPhone: purchaseData[0].clientPhone ?? "",
      clientWhatsapp: purchaseData[0].clientWhatsapp ?? "",
      clientEmail: purchaseData[0].clientContactInfo 
        ? (purchaseData[0].clientContactInfo as any)?.email ?? ""
        : "",
      
      // Beneficiary info
      beneficiarioName: purchaseData[0].beneficiarioFirstName 
        ? `${purchaseData[0].beneficiarioFirstName} ${purchaseData[0].beneficiarioLastName ?? ""}`
        : "",
      beneficiarioLastName: purchaseData[0].beneficiarioLastName ?? "",
      beneficiarioFirstName: purchaseData[0].beneficiarioFirstName ?? "",
      beneficiarioGrade: purchaseData[0].beneficiarioGrade ?? "",
      beneficiarioSection: purchaseData[0].beneficiarioSection ?? "",
      beneficiarioSchool: purchaseData[0].beneficiarioSchool ?? "",
      
      // Bundle info
      bundleName: purchaseData[0].bundleName ?? "",
      bundleItems: bundleItemsData.map(item => ({
        name: item.itemName ?? "",
        description: item.itemDescription ?? "",
        quantity: item.quantity ?? 0,
      })),
      
      // Organization info
      organizationName: purchaseData[0].organizationName ?? "",
      
      // Payment info
      totalPaid,
      remaining,
      payments: paymentsData.map(payment => ({
        amount: Number(payment.amount),
        date: payment.paymentDate,
        method: payment.method ?? "",
        status: payment.status ?? "",
      })),
    };

    return { success: true, data: fichaData };
  } catch (error) {
    console.error("Error fetching ficha data:", error);
    return { success: false, error: "Failed to fetch data for the ficha" };
  }
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Helper function to format the ficha message
function formatFichaMessage(fichaData: FichaData): string {
  // Helper to safely format dates
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-VE');
  };

  return `Osuna Fotografías📸 
Paquetes de Grado👨🏻‍🎓

\`\`\`DATOS DEL REPRESENTANTE\`\`\`
*Nombre y Apellido:* ${fichaData.clientName}
*C.I:* ${fichaData.clientDocument}
*Celular ó Tlf:* ${fichaData.clientPhone}
*Correo Electrónico:* ${fichaData.clientEmail}

\`\`\`DATOS DEL ALUMNO 👨‍🎓\`\`\`
*Apellidos del alumno:* ${fichaData.beneficiarioLastName}
*Nombres del alumno:* ${fichaData.beneficiarioFirstName}
*Nombre del Colegio:* ${fichaData.beneficiarioSchool}
*Nivel:* ${fichaData.beneficiarioGrade}
*Sección:* ${fichaData.beneficiarioSection}

\`\`\`INFORMACIÓN DE PAGO 🧾\`\`\`
*Costo del Paquete:* ${formatCurrency(fichaData.totalAmount)}
*Cargo adicionales:* ${formatCurrency(0)} 

*Abono de:* ${formatCurrency(fichaData.totalPaid)}
*Resta:* ${formatCurrency(fichaData.remaining)}

${fichaData.payments.length > 0 ? `*Último Pago:* ${formatCurrency(fichaData.payments[0].amount)}
*De fecha:* ${formatDate(fichaData.payments[0].date)}
*Método:* ${fichaData.payments[0].method}` : ''}

Estimado Representante
Por favor.
Verifique los datos de la ficha y envíela para poder registrar el detalle en su pedido y Paquete de Grado.
*Nota: Ya está Participando en nuestra Rifa Estudiantil✅*

Muchas Gracias 🤝`;
}

// New action to send ficha via WhatsApp
export async function sendFichaWhatsApp(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get ficha data
    const fichaResult = await getFichaData(purchaseId);
    if (!fichaResult.success || !fichaResult.data) {
      throw new Error(fichaResult.error || 'Failed to get ficha data');
    }

    // Format the message
    const message = formatFichaMessage(fichaResult.data);

    // Get the client's WhatsApp number
    const whatsappNumber = fichaResult.data.clientWhatsapp;
    if (!whatsappNumber) {
      throw new Error('No WhatsApp number found for client');
    }

    // Clean the WhatsApp number - remove any non-digits and the + symbol
    const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
    console.log('Sending WhatsApp to number:', cleanNumber); // Debug log

    // Send the message using the WhatsApp service
    const response = await fetch(`${process.env.NEXT_PUBLIC_EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: message,
        delay: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Evolution API Error:', error); // Debug log
      throw new Error(error.message || 'Failed to send WhatsApp message');
    }

    const data = await response.json();
    console.log('Evolution API Response:', data); // Debug log

    return { success: true };
  } catch (error) {
    console.error('Error sending ficha via WhatsApp:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send ficha via WhatsApp'
    };
  }
}

// Export certificados to Excel
export async function exportCertificadosToExcel() {
  try {
    // Get all certificados data
    const result = await getCertificadoSales();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch certificados data');
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Process each organization group
    result.data.forEach((group) => {
      // Format sales data for Excel
      const salesData = group.sales.map((sale) => ({
        "ID": sale.id,
        "Fecha": sale.purchaseDate ? new Date(sale.purchaseDate).toLocaleDateString('es-VE') : 'N/A',
        "Cliente": sale.clientName || 'N/A',
        "Beneficiario": sale.beneficiarioFirstName && sale.beneficiarioLastName 
          ? `${sale.beneficiarioFirstName} ${sale.beneficiarioLastName}`
          : 'N/A',
        "Grado": sale.beneficiarioGrade || 'N/A',
        "Sección": sale.beneficiarioSection || 'N/A',
        "Paquete": sale.bundleName || 'N/A',
        "Monto": sale.totalAmount ? formatCurrency(Number(sale.totalAmount)) : 'N/A',
        "Estado": sale.status,
        "Estado de Pago": sale.isPaid ? 'Pagado' : (sale.paymentStatus || 'N/A'),
        "Estado de Certificado": sale.certificateStatus || 'No generado',
        "URL de Certificado": sale.certificateFileUrl || 'N/A',
      }));

      // Create worksheet for this group
      const worksheet = XLSX.utils.json_to_sheet(salesData);

      // Add summary rows
      XLSX.utils.sheet_add_json(worksheet, [
        {
          "ID": 'Total Ventas:',
          "Fecha": group.totalSales,
          "Cliente": 'Monto Total:',
          "Beneficiario": formatCurrency(group.totalAmount),
        }
      ], {
        skipHeader: true,
        origin: -1
      });

      // Add the worksheet to the workbook
      const sheetName = (group.name || 'Ventas Generales').slice(0, 31); // Excel has a 31 char limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate a unique filename
    const filename = `certificados_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = join(process.cwd(), "public", "exports", filename);

    // Ensure exports directory exists
    const exportsDir = join(process.cwd(), "public", "exports");
    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true });
    }

    // Save the file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    await writeFile(filepath, excelBuffer);

    return {
      success: true,
      downloadUrl: `/exports/${filename}`,
      filename: filename,
      message: "Archivo Excel generado correctamente",
    };
  } catch (error) {
    console.error("Error exporting certificados:", error);
    return { 
      success: false, 
      error: "Error al exportar los certificados" 
    };
  }
} 