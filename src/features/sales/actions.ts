"use server"

import { db } from "@/db"
import {
  purchases,
  purchaseItems,
  inventoryItems,
  inventoryTransactions,
  clients,
  bundles,
  bundleItems,
  beneficiarios,
  organizations,
  payments,
  paymentPlans,
  saleTypeEnum,
} from "@/db/schema"
import { and, eq, sql, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { formatCurrency } from "@/lib/utils"
import * as XLSX from "xlsx"
import { writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"

// Helper function to format dates for export
const formatExportDate = (date: Date | string | null): string => {
  if (!date) return "N/A"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

// Function to export sale to Excel
export async function exportSaleToExcel(id: string, download = false) {
  try {
    // Get purchase details
    const result = await db
      .select({
        purchase: purchases,
        client: clients,
        organization: organizations,
      })
      .from(purchases)
      .where(eq(purchases.id, id))
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))

    if (result.length === 0) {
      return { success: false, error: "Venta no encontrada" }
    }

    const { purchase, client, organization } = result[0]

    // Get purchase items
    const itemsResult = await db
      .select({
        id: purchaseItems.id,
        quantity: purchaseItems.quantity,
        unitPrice: purchaseItems.unitPrice,
        totalPrice: purchaseItems.totalPrice,
        inventoryItem: {
          id: inventoryItems.id,
          name: inventoryItems.name,
          sku: inventoryItems.sku,
        },
      })
      .from(purchaseItems)
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .where(eq(purchaseItems.purchaseId, id))

    // Get payments information if available
    let paymentsInfo = null
    try {
      // Get all payments using Drizzle syntax
      const paymentsData = await db
        .select()
        .from(payments)
        .where(eq(payments.purchaseId, id))

      if (paymentsData.length > 0) {
        const pendingPayments = paymentsData.filter(
          (payment) => payment.status === "PENDING" || payment.status === "OVERDUE",
        )
        const pendingAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

        // Get next payment due date
        let nextPaymentDue = null
        if (pendingPayments.length > 0) {
          nextPaymentDue = pendingPayments.sort(
            (a, b) => {
              const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
              const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
              return dateA - dateB;
            },
          )[0]
        }

        // Get payment plan
        const paymentPlansData = await db
          .select()
          .from(paymentPlans)
          .where(eq(paymentPlans.purchaseId, id))

        const paymentPlan = paymentPlansData.length > 0 ? paymentPlansData[0] : null

        // Format installment plan
        let installmentPlanText = "No aplica"
        if (paymentPlan) {
          installmentPlanText = `${paymentPlan.installmentCount} cuotas ${
            paymentPlan.installmentFrequency === "WEEKLY"
              ? "semanales"
              : paymentPlan.installmentFrequency === "BIWEEKLY"
                ? "quincenales"
                : "mensuales"
          }`
        }

        paymentsInfo = {
          paymentsCount: paymentsData.length,
          pendingPayments: pendingPayments.length,
          nextPaymentDueDate: nextPaymentDue && nextPaymentDue.dueDate ? formatExportDate(nextPaymentDue.dueDate) : null,
          pendingAmount: pendingAmount > 0 ? formatCurrency(pendingAmount) : null,
          installmentPlan: installmentPlanText,
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      // Continue without payments data
    }

    // Format items for the export
    const formattedItems = itemsResult.map((item) => ({
      name: item.inventoryItem?.name || "Producto eliminado",
      sku: item.inventoryItem?.sku || "N/A",
      quantity: item.quantity,
      unitPrice: formatCurrency(Number(item.unitPrice)),
      totalPrice: formatCurrency(Number(item.totalPrice)),
    }))

    // Get client contact info for email
    const clientContactInfo = client?.contactInfo as { email?: string } || {}
    
    // Format data for export
    const exportData = {
      id: purchase.id,
      clientName: client?.name || "Cliente no registrado",
      clientEmail: clientContactInfo.email || "",
      clientPhone: client?.phone || "",
      purchaseDate: formatExportDate(purchase.purchaseDate),
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      totalAmount: formatCurrency(Number(purchase.totalAmount)),
      transactionReference: purchase.transactionReference || "",
      isPaid: purchase.isPaid || false,
      // Use saleType if it exists in custom metadata or default to "DIRECT"
      saleType: (purchase.paymentMetadata as any)?.saleType || "DIRECT",
      organizationName: organization?.name || "",
      organizationType: organization?.type || "",
      items: formattedItems,
      // Add payment information if available
      ...(paymentsInfo || {}),
    }

    if (download) {
      // Create Excel workbook with multiple sheets
      const workbook = XLSX.utils.book_new()

      // Sale details sheet
      const saleDetailsSheet = XLSX.utils.json_to_sheet([
        {
          "ID de Venta": exportData.id,
          "Fecha de Compra": exportData.purchaseDate,
          Estado: exportData.status,
          "Método de Pago": exportData.paymentMethod,
          "Monto Total": exportData.totalAmount,
          Referencia: exportData.transactionReference,
          Pagado: exportData.isPaid ? "Sí" : "No",
          "Tipo de Venta":
            exportData.saleType === "DIRECT"
              ? "Directa"
              : exportData.saleType === "PRESALE"
                ? "Preventa"
                : exportData.saleType,
        },
      ])
      XLSX.utils.book_append_sheet(workbook, saleDetailsSheet, "Detalles de Venta")

      // Client details sheet
      const clientDetailsSheet = XLSX.utils.json_to_sheet([
        {
          "Nombre del Cliente": exportData.clientName,
          Email: exportData.clientEmail,
          Teléfono: exportData.clientPhone,
          Organización: exportData.organizationName,
          "Tipo de Organización": exportData.organizationType,
        },
      ])
      XLSX.utils.book_append_sheet(workbook, clientDetailsSheet, "Cliente")

      // Items sheet
      const itemsSheet = XLSX.utils.json_to_sheet(
        formattedItems.map((item) => ({
          Producto: item.name,
          SKU: item.sku,
          Cantidad: item.quantity,
          "Precio Unitario": item.unitPrice,
          "Precio Total": item.totalPrice,
        })),
      )
      XLSX.utils.book_append_sheet(workbook, itemsSheet, "Productos")

      // Payments sheet (if available)
      if (paymentsInfo) {
        const paymentsSheet = XLSX.utils.json_to_sheet([
          {
            "Total de Pagos": paymentsInfo.paymentsCount,
            "Pagos Pendientes": paymentsInfo.pendingPayments,
            "Próximo Vencimiento": paymentsInfo.nextPaymentDueDate || "N/A",
            "Monto Pendiente": paymentsInfo.pendingAmount || "0.00",
            "Plan de Pagos": paymentsInfo.installmentPlan,
          },
        ])
        XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Pagos")
      }

      // Generate a unique filename
      const filename = `venta_${purchase.id.substring(0, 8)}_${Date.now()}.xlsx`

      // Make sure the exports directory exists
      const exportsDir = join(process.cwd(), "public", "exports")
      if (!existsSync(exportsDir)) {
        await mkdir(exportsDir, { recursive: true })
      }

      const filepath = join(exportsDir, filename)

      // Save the file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
      await writeFile(filepath, excelBuffer)

      // Return the public URL path to the file
      return {
        success: true,
        downloadUrl: `/exports/${filename}`,
        filename: filename,
        message: "Archivo Excel generado correctamente",
      }
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting sale:", error)
    return { success: false, error: "Error al exportar la venta" }
  }
}

export async function getPurchaseDetails(id: string) {
  try {
    const result = await db
      .select({
        purchase: purchases,
        client: clients,
        organization: organizations,
        beneficiary: beneficiarios,
        bundle: bundles,
        items: sql`
          json_agg(json_build_object(
            'id', ${purchaseItems.id},
            'inventoryItem', ${inventoryItems},
            'quantity', ${purchaseItems.quantity},
            'unitPrice', ${purchaseItems.unitPrice},
            'totalPrice', ${purchaseItems.totalPrice}
          ))
        `,
      })
      .from(purchases)
      .where(eq(purchases.id, id))
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
      .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .groupBy(purchases.id, clients.id, organizations.id, beneficiarios.id, bundles.id)

    if (result.length === 0) return { success: false, error: "Venta no encontrada" }

    return {
      success: true,
      data: {
        ...result[0].purchase,
        client: result[0].client,
        organization: result[0].organization,
        beneficiary: result[0].beneficiary,
        bundle: result[0].bundle,
        items: result[0].items,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase details:", error)
    return { success: false, error: "Error al obtener detalles de la venta" }
  }
}

export async function createPurchase(data: {
  clientId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    overridePrice?: number;
  }>;
  bundleId?: string;
  beneficiaryId?: string;
  beneficiary?: {
    firstName: string;
    lastName: string;
    school: string;
    level: string;
    section: string;
  };
  paymentMethod: string;
  saleType: "DIRECT" | "PRESALE";
  transactionReference?: string;
  organizationId?: string | null;
}) {
  try {
    // Start a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Calculate the total price based on items
      let totalAmount = 0;

      // Calculate total from items
      for (const item of data.items) {
        const inventoryItem = await tx
          .select({ basePrice: inventoryItems.basePrice })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, item.itemId))
          .limit(1);

        if (!inventoryItem.length) {
          throw new Error(`Item not found: ${item.itemId}`);
        }

        const price = item.overridePrice || Number(inventoryItem[0].basePrice);
        totalAmount += price * item.quantity;
      }

      // Insert the purchase
      const [purchase] = await tx.insert(purchases).values({
        clientId: data.clientId,
        beneficiarioId: data.beneficiaryId,
        bundleId: data.bundleId,
        status: "COMPLETED",
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: "PAID",
        isPaid: true,
        organizationId: data.organizationId === "none" ? null : data.organizationId,
        transactionReference: data.transactionReference,
        bookingMethod: data.saleType,
      }).returning();

      // Insert purchase items
      for (const item of data.items) {
        const inventoryItem = await tx
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.id, item.itemId))
          .limit(1);

        if (!inventoryItem.length) {
          throw new Error(`Item not found: ${item.itemId}`);
        }

        const price = item.overridePrice || Number(inventoryItem[0].basePrice);
        
        await tx.insert(purchaseItems).values({
          purchaseId: purchase.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: price.toString(),
          totalPrice: (price * item.quantity).toString(),
        });

        // If not a presale, update inventory immediately
        if (data.saleType !== "PRESALE") {
          // Decrease stock
          await tx
            .update(inventoryItems)
            .set({ 
              currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.itemId));
          
          // Record transaction
          await tx.insert(inventoryTransactions).values({
            itemId: item.itemId,
            quantity: item.quantity,
            transactionType: "OUT",
            reference: { purchaseId: purchase.id },
          });
        } else {
          // For presales, reserve the stock
          await tx
            .update(inventoryItems)
            .set({ 
              reservedStock: sql`${inventoryItems.reservedStock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.itemId));
          
          // Record reservation transaction
          await tx.insert(inventoryTransactions).values({
            itemId: item.itemId,
            quantity: item.quantity,
            transactionType: "RESERVATION",
            reference: { purchaseId: purchase.id },
          });
        }
      }

      // If this sale is for a bundle and doesn't have a beneficiaryId but has beneficiary details, create a beneficiary
      if (data.bundleId && !data.beneficiaryId && data.beneficiary) {
        const fullName = `${data.beneficiary.firstName} ${data.beneficiary.lastName}`;
        
        // Create a new beneficiary
        const [newBeneficiary] = await tx.insert(beneficiarios).values({
          name: fullName,
          clientId: data.clientId,
          firstName: data.beneficiary.firstName,
          lastName: data.beneficiary.lastName,
          school: data.beneficiary.school,
          level: data.beneficiary.level,
          section: data.beneficiary.section,
          bundleId: data.bundleId,
          organizationId: data.organizationId === "none" ? null : data.organizationId,
          status: "ACTIVE",
        }).returning();
        
        // Update the purchase with the beneficiary ID
        await tx
          .update(purchases)
          .set({ beneficiarioId: newBeneficiary.id })
          .where(eq(purchases.id, purchase.id));
      }

      // Update bundle stats if this is a bundle purchase
      if (data.bundleId) {
        await tx
          .update(bundles)
          .set({ 
            totalSales: sql`${bundles.totalSales} + 1`,
            lastSaleDate: new Date(),
            totalRevenue: sql`${bundles.totalRevenue} + ${totalAmount}`,
          })
          .where(eq(bundles.id, data.bundleId));
      }

      // Get the full purchase details with relations for the response
      const purchaseDetails = await tx
        .select({
          purchase: purchases,
          client: clients,
          beneficiary: beneficiarios,
          organization: organizations,
          bundle: bundles,
        })
        .from(purchases)
        .leftJoin(clients, eq(purchases.clientId, clients.id))
        .leftJoin(beneficiarios, eq(purchases.beneficiarioId, beneficiarios.id))
        .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
        .leftJoin(bundles, eq(purchases.bundleId, bundles.id))
        .where(eq(purchases.id, purchase.id))
        .limit(1);

      if (!purchaseDetails.length) {
        throw new Error("Failed to retrieve purchase details");
      }

      // Get purchase items
      const items = await tx
        .select({
          item: purchaseItems,
          inventoryItem: inventoryItems,
        })
        .from(purchaseItems)
        .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
        .where(eq(purchaseItems.purchaseId, purchase.id));

      return {
        success: true,
        data: {
          ...purchaseDetails[0],
          items,
        },
      };
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getSalesData() {
  try {
    // Modificamos la consulta para usar el metadata para saleType
    const sales = await db
      .select({
        id: purchases.id,
        clientId: purchases.clientId,
        bundleId: purchases.bundleId,
        status: purchases.status,
        totalAmount: purchases.totalAmount,
        paymentMethod: purchases.paymentMethod,
        purchaseDate: purchases.purchaseDate,
        transactionReference: purchases.transactionReference,
        // Usamos un valor por defecto para isPaid si no existe
        isPaid: sql`COALESCE(${purchases.isPaid}, false)`,
        client: clients,
        organization: organizations,
        // Extraer el saleType del paymentMetadata
        saleType: sql`COALESCE((${purchases.paymentMetadata}->>'saleType')::text, 'DIRECT')`,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(organizations, eq(purchases.organizationId, organizations.id))
      .orderBy(sql`${purchases.purchaseDate} DESC`)

    return {
      success: true,
      data: sales,
    }
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return { success: false, error: "Failed to fetch sales data" }
  }
}

export async function updatePurchaseStatus(id: string, newStatus: string) {
  try {
    // Validar el nuevo estado
    const validStatuses = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const
    if (!validStatuses.includes(newStatus as (typeof validStatuses)[number])) {
      return { success: false, error: "Estado inválido" }
    }

    // Asegurar que el tipo sea compatible con el enum de Drizzle
    const status = newStatus as (typeof validStatuses)[number]

    const [updatedPurchase] = await db
      .update(purchases)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning()

    // Revalidar rutas relevantes
    revalidatePath("/sales")
    revalidatePath(`/sales/${id}`)

    return {
      success: true,
      data: updatedPurchase,
    }
  } catch (error) {
    console.error("Error updating status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el estado",
    }
  }
}

// Arreglar la función searchBundles para asegurar que devuelva datos correctos
export async function searchBundles(query: string) {
  try {
    // Primero obtenemos los bundles que coinciden con la búsqueda
    const bundlesResult = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
      })
      .from(bundles)
      .where(and(eq(bundles.status, "ACTIVE"), sql`LOWER(${bundles.name}) LIKE ${"%" + query.toLowerCase() + "%"}`))
      .limit(10)

    // Para cada bundle, obtenemos sus items
    const bundlesWithItems = await Promise.all(
      bundlesResult.map(async (bundle) => {
        const bundleItemsResult = await db
          .select({
            id: bundleItems.id,
            quantity: bundleItems.quantity,
            overridePrice: bundleItems.overridePrice,
            item: {
              id: inventoryItems.id,
              name: inventoryItems.name,
              currentStock: inventoryItems.currentStock,
              basePrice: inventoryItems.basePrice,
              // Obtener metadata donde allowPreSale podría estar almacenado
              metadata: inventoryItems.metadata,
            },
          })
          .from(bundleItems)
          .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
          .where(eq(bundleItems.bundleId, bundle.id))

        // Procesar los resultados para extraer allowPreSale de metadata
        const processedItems = bundleItemsResult.map(item => {
          const metadata = item.item.metadata as { allowPreSale?: boolean } || {};
          return {
            ...item,
            item: {
              ...item.item,
              allowPreSale: metadata.allowPreSale || false,
            }
          };
        });

        return {
          ...bundle,
          items: processedItems,
        }
      }),
    )

    return { success: true, data: bundlesWithItems }
  } catch (error) {
    console.error("Error searching bundles:", error)
    return { success: false, error: "Error buscando paquetes" }
  }
}

export async function searchInventoryItems(query: string) {
  try {
    const data = await db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.status, "ACTIVE"),
          or(
            sql`LOWER(${inventoryItems.name}) LIKE ${"%" + query.toLowerCase() + "%"}`,
            sql`LOWER(${inventoryItems.sku}) LIKE ${"%" + query.toLowerCase() + "%"}`,
          ),
        ),
      )
      .limit(10)

    return { success: true, data }
  } catch (error) {
    console.error("Error searching inventory items:", error)
    return { success: false, error: "Error buscando productos" }
  }
}

export async function searchClients(query: string) {
  try {
    const data = await db
      .select({
        id: clients.id,
        name: clients.name,
        document: clients.document,
        phone: clients.phone,
        contactInfo: clients.contactInfo, // Incluir contactInfo para acceder al email
        organizationId: clients.organizationId,
        organization: organizations,
      })
      .from(clients)
      .leftJoin(organizations, eq(clients.organizationId, organizations.id))
      .where(
        or(
          sql`LOWER(${clients.name}) LIKE ${"%" + query.toLowerCase() + "%"}`,
          sql`${clients.id}::text LIKE ${"%" + query.toLowerCase() + "%"}`,
        ),
      )
      .limit(10)

    return { success: true, data }
  } catch (error) {
    console.error("Error searching clients:", error)
    return { success: false, error: "Error buscando clientes" }
  }
}

export async function deleteBundle(bundleId: string) {
  try {
    // Verificar si hay ventas asociadas al paquete
    const salesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(eq(purchases.bundleId, bundleId))

    if (salesCount[0].count > 0) {
      return {
        success: false,
        error: "No se puede eliminar el paquete porque tiene ventas asociadas",
      }
    }

    // Eliminar beneficiarios asociados (ahora en tabla beneficiarios)
    await db.delete(beneficiarios).where(eq(beneficiarios.bundleId, bundleId))

    // Eliminar items del paquete
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, bundleId))

    // Finalmente, eliminar el paquete
    const [deletedBundle] = await db.delete(bundles).where(eq(bundles.id, bundleId)).returning()

    if (!deletedBundle) {
      return { success: false, error: "Paquete no encontrado" }
    }

    // Revalidar rutas
    revalidatePath("/packages")

    return { success: true, data: deletedBundle }
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar el paquete",
    }
  }
}

// Funciones para manejar la pre-venta
export async function updateItemPreSaleFlag(itemId: string, allowPreSale: boolean) {
  try {
    // Primero obtenemos el item para conseguir su metadata actual
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
    
    if (!item) {
      return { success: false, error: "Item no encontrado" }
    }
    
    // Preparar el nuevo metadata con allowPreSale
    const currentMetadata = item.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      allowPreSale
    }
    
    // Actualizar el item con el nuevo metadata
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date()
      })
      .where(eq(inventoryItems.id, itemId))
      .returning()
    
    return { success: true, data: updatedItem }
  } catch (error) {
    console.error("Error updating pre-sale flag:", error)
    return { success: false, error: "Error al actualizar el estado de pre-venta" }
  }
}

export async function getPreSaleCount(itemId: string) {
  try {
    // Contar todas las ventas de tipo PRESALE que incluyen este item
    const presales = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(
        and(
          eq(purchaseItems.itemId, itemId),
          eq(sql`(${purchases.paymentMetadata}->>'saleType')::text`, 'PRESALE')
        )
      )
    
    return { success: true, data: presales[0].count }
  } catch (error) {
    console.error("Error fetching pre-sale count:", error)
    return { success: false, error: "Error al obtener el conteo de pre-ventas" }
  }
}


