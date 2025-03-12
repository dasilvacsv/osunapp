"use server"

import { db } from "@/db"
import {
  bundles,
  bundleBeneficiaries,
  purchases,
  clients,
  bundleItems,
  inventoryItems,
  bundleCategories,
  organizations,
} from "@/db/schema"
import { eq, sql, desc, and, count, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { formatCurrency } from "@/lib/utils"
import * as XLSX from "xlsx"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Tipos
export type BundleType = "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
export type PurchaseStatus = "COMPLETED" | "PENDING" | "APPROVED" | "IN_PROGRESS" | "CANCELLED"
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER"

export type BundleWithBeneficiaries = {
  id: string
  name: string
  description: string
  basePrice: number
  discountPercentage: number | null
  type: BundleType
  status: string
  categoryName?: string | null
  salesData: {
    totalSales: number
    totalRevenue: number
    lastSaleDate: Date | null
    sales?: Array<{
      id: string
      clientName: string
      beneficiaryName: string
      purchaseDate: Date
      status: PurchaseStatus
      paymentMethod: PaymentMethod
      amount: number
    }>
  }
  beneficiaries: Array<{
    id: string
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
    status: "ACTIVE" | "INACTIVE"
    createdAt: Date
    organizationId?: string | null
    isComplete?: boolean
    purchase: {
      id: string
      purchaseDate: Date
      totalAmount: number
    } | null
  }>
  items?: Array<{
    id: string
    quantity: number
    overridePrice: number | null
    item: {
      id: string
      name: string
      sku: string
      basePrice: number
      type: string
    }
  }>
}

// Type for beneficiary data export
export type BeneficiaryExportData = {
  id: string
  firstName: string
  lastName: string
  school: string
  level: string
  section: string
  status: string
  createdAt: string
  bundleName: string
  bundleType: string
  bundlePrice: string
  purchaseStatus?: string
  purchaseDate?: string
  paymentMethod?: string
  totalAmount?: string
  organizationName?: string
  organizationType?: string
}

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

export async function addBundleBeneficiary(
  bundleId: string,
  data: {
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
    organizationId?: string
  },
) {
  try {
    const [beneficiary] = await db
      .insert(bundleBeneficiaries)
      .values({
        bundleId,
        firstName: data.firstName,
        lastName: data.lastName,
        school: data.school,
        level: data.level,
        section: data.section,
        organizationId: data.organizationId || null,
        status: "ACTIVE",
      })
      .returning()

    revalidatePath(`/packages/${bundleId}`)
    return { success: true, data: beneficiary }
  } catch (error) {
    console.error("Error adding beneficiary:", error)
    return { success: false, error: "Error al agregar beneficiario" }
  }
}

export async function removeBundleBeneficiary(id: string) {
  try {
    const [beneficiary] = await db.delete(bundleBeneficiaries).where(eq(bundleBeneficiaries.id, id)).returning()

    if (!beneficiary) {
      return { success: false, error: "Beneficiario no encontrado" }
    }

    revalidatePath(`/packages/${beneficiary.bundleId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing beneficiary:", error)
    return { success: false, error: "Error al eliminar beneficiario" }
  }
}

export async function getPackagesWithStats() {
  try {
    // Primero obtenemos los bundles básicos
    const bundlesResult = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        type: bundles.type,
        basePrice: bundles.basePrice,
        status: bundles.status,
      })
      .from(bundles)

    // Para cada bundle, obtenemos estadísticas adicionales
    const result = await Promise.all(
      bundlesResult.map(async (bundle) => {
        // Contar beneficiarios
        const [beneficiariesCount] = await db
          .select({ count: count() })
          .from(bundleBeneficiaries)
          .where(eq(bundleBeneficiaries.bundleId, bundle.id))

        // Contar ventas completadas
        const [salesCount] = await db
          .select({ count: count() })
          .from(purchases)
          .where(and(eq(purchases.bundleId, bundle.id), eq(purchases.status, "COMPLETED")))

        // Calcular ingresos totales
        const [totalRevenue] = await db
          .select({
            sum: sql<string>`COALESCE(SUM(${purchases.totalAmount}), 0)::text`,
          })
          .from(purchases)
          .where(and(eq(purchases.bundleId, bundle.id), eq(purchases.status, "COMPLETED")))

        // Obtener fecha de última venta
        const [lastSale] = await db
          .select({ date: purchases.purchaseDate })
          .from(purchases)
          .where(eq(purchases.bundleId, bundle.id))
          .orderBy(desc(purchases.purchaseDate))
          .limit(1)

        // Obtener beneficiarios
        const beneficiaries = await db
          .select({
            id: bundleBeneficiaries.id,
            firstName: bundleBeneficiaries.firstName,
            lastName: bundleBeneficiaries.lastName,
            school: bundleBeneficiaries.school,
            level: bundleBeneficiaries.level,
            section: bundleBeneficiaries.section,
            status: bundleBeneficiaries.status,
            organizationId: bundleBeneficiaries.organizationId,
            isComplete: sql<boolean>`
              CASE WHEN 
                ${bundleBeneficiaries.firstName} IS NOT NULL AND 
                ${bundleBeneficiaries.lastName} IS NOT NULL AND 
                ${bundleBeneficiaries.school} IS NOT NULL AND 
                ${bundleBeneficiaries.level} IS NOT NULL AND 
                ${bundleBeneficiaries.section} IS NOT NULL
              THEN true ELSE false END
            `,
          })
          .from(bundleBeneficiaries)
          .where(eq(bundleBeneficiaries.bundleId, bundle.id))

        return {
          ...bundle,
          totalSales: salesCount.count,
          totalRevenue: totalRevenue.sum,
          beneficiariesCount: beneficiariesCount.count,
          lastSaleDate: lastSale?.date || null,
          beneficiaries: beneficiaries,
        }
      }),
    )

    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching packages:", error)
    return { success: false, error: "Error al obtener los paquetes" }
  }
}

export async function getBundles() {
  try {
    const bundlesResult = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        type: bundles.type,
        basePrice: bundles.basePrice,
        status: bundles.status,
      })
      .from(bundles)

    return { success: true, data: bundlesResult }
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return { success: false, error: "Error al obtener los paquetes" }
  }
}

export async function getBundleDetails(id: string) {
  try {
    // 1. Obtener información básica del bundle
    const [bundle] = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        description: bundles.description,
        basePrice: bundles.basePrice,
        discountPercentage: bundles.discountPercentage,
        type: bundles.type,
        status: bundles.status,
        categoryId: bundles.categoryId,
      })
      .from(bundles)
      .where(eq(bundles.id, id))

    if (!bundle) {
      return { success: false, error: "Paquete no encontrado" }
    }

    // 2. Obtener nombre de la categoría si existe
    let categoryName = null
    if (bundle.categoryId) {
      const [category] = await db
        .select({
          name: bundleCategories.name,
        })
        .from(bundleCategories)
        .where(eq(bundleCategories.id, bundle.categoryId))

      categoryName = category?.name || null
    }

    // 3. Obtener items del bundle con sus detalles
    const bundleItemsResult = await db
      .select({
        id: bundleItems.id,
        quantity: bundleItems.quantity,
        overridePrice: bundleItems.overridePrice,
        item: {
          id: inventoryItems.id,
          name: inventoryItems.name,
          sku: inventoryItems.sku,
          basePrice: inventoryItems.basePrice,
          type: inventoryItems.type,
        },
      })
      .from(bundleItems)
      .innerJoin(inventoryItems, eq(bundleItems.itemId, inventoryItems.id))
      .where(eq(bundleItems.bundleId, id))

    // 4. Obtener beneficiarios del bundle
    const beneficiaries = await db
      .select({
        id: bundleBeneficiaries.id,
        firstName: bundleBeneficiaries.firstName,
        lastName: bundleBeneficiaries.lastName,
        school: bundleBeneficiaries.school,
        level: bundleBeneficiaries.level,
        section: bundleBeneficiaries.section,
        status: bundleBeneficiaries.status,
        createdAt: bundleBeneficiaries.createdAt,
        organizationId: bundleBeneficiaries.organizationId,
        isComplete: sql<boolean>`
          CASE WHEN 
            ${bundleBeneficiaries.firstName} IS NOT NULL AND 
            ${bundleBeneficiaries.lastName} IS NOT NULL AND 
            ${bundleBeneficiaries.school} IS NOT NULL AND 
            ${bundleBeneficiaries.level} IS NOT NULL AND 
            ${bundleBeneficiaries.section} IS NOT NULL
          THEN true ELSE false END
        `,
      })
      .from(bundleBeneficiaries)
      .where(eq(bundleBeneficiaries.bundleId, id))

    // 5. Obtener todas las compras para este bundle
    const purchases_data = await db
      .select({
        id: purchases.id,
        clientId: purchases.clientId,
        status: purchases.status,
        totalAmount: purchases.totalAmount,
        purchaseDate: purchases.purchaseDate,
        paymentMethod: purchases.paymentMethod,
      })
      .from(purchases)
      .where(eq(purchases.bundleId, id))

    // 6. Obtener información de clientes para cada compra
    const salesWithClientInfo = await Promise.all(
      purchases_data.map(async (sale) => {
        const [client] = await db
          .select({
            id: clients.id,
            name: clients.name,
          })
          .from(clients)
          .where(eq(clients.id, sale.clientId))

        // Buscar un beneficiario asociado a esta compra
        // En una implementación real, tendrías una relación directa
        const beneficiary = beneficiaries.length > 0 ? beneficiaries[0] : null

        return {
          id: sale.id,
          clientName: client?.name || "Cliente desconocido",
          beneficiaryName: beneficiary ? `${beneficiary.firstName} ${beneficiary.lastName}` : "Sin beneficiario",
          purchaseDate: sale.purchaseDate,
          status: sale.status as PurchaseStatus,
          paymentMethod: sale.paymentMethod as PaymentMethod,
          amount: Number(sale.totalAmount),
        }
      }),
    )

    // 7. Calcular estadísticas de ventas
    const completedSales = purchases_data.filter((sale) => sale.status === "COMPLETED")
    const totalRevenue = completedSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)

    // 8. Encontrar la fecha de la última venta
    const lastSaleDate =
      purchases_data.length > 0
        ? purchases_data.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0]
            .purchaseDate
        : null

    // 9. Mejorar beneficiarios con información de compra
    const enhancedBeneficiaries = await Promise.all(
      beneficiaries.map(async (beneficiary) => {
        // Buscar una compra asociada a este beneficiario
        // En una implementación real, tendrías una relación directa
        const [purchase] = await db
          .select({
            id: purchases.id,
            purchaseDate: purchases.purchaseDate,
            totalAmount: purchases.totalAmount,
          })
          .from(purchases)
          .where(eq(purchases.bundleId, id))
          .limit(1)

        return {
          ...beneficiary,
          purchase: purchase || null,
        }
      }),
    )

    // 10. Construir y retornar el resultado final
    return {
      success: true,
      data: {
        ...bundle,
        categoryName,
        items: bundleItemsResult,
        beneficiaries: enhancedBeneficiaries,
        salesData: {
          totalSales: completedSales.length,
          totalRevenue: totalRevenue,
          lastSaleDate: lastSaleDate,
          sales: salesWithClientInfo,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching bundle details:", error)
    return { success: false, error: "Error al obtener detalles del paquete" }
  }
}

export async function getBeneficiaryDetails(id: string) {
  try {
    // Obtener detalles del beneficiario
    const [beneficiary] = await db
      .select({
        id: bundleBeneficiaries.id,
        firstName: bundleBeneficiaries.firstName,
        lastName: bundleBeneficiaries.lastName,
        school: bundleBeneficiaries.school,
        level: bundleBeneficiaries.level,
        section: bundleBeneficiaries.section,
        status: bundleBeneficiaries.status,
        bundleId: bundleBeneficiaries.bundleId,
        createdAt: bundleBeneficiaries.createdAt,
        organizationId: bundleBeneficiaries.organizationId,
        isComplete: sql<boolean>`
          CASE WHEN 
            ${bundleBeneficiaries.firstName} IS NOT NULL AND 
            ${bundleBeneficiaries.lastName} IS NOT NULL AND 
            ${bundleBeneficiaries.school} IS NOT NULL AND 
            ${bundleBeneficiaries.level} IS NOT NULL AND 
            ${bundleBeneficiaries.section} IS NOT NULL
          THEN true ELSE false END
        `,
      })
      .from(bundleBeneficiaries)
      .where(eq(bundleBeneficiaries.id, id))

    if (!beneficiary) {
      return { success: false, error: "Beneficiario no encontrado" }
    }

    // Obtener detalles del bundle asociado
    const [bundle] = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
      })
      .from(bundles)
      .where(eq(bundles.id, beneficiary.bundleId))

    // Buscar compras asociadas a este beneficiario
    // En una implementación real, tendrías una relación directa entre beneficiarios y compras
    const [purchase] = await db
      .select({
        id: purchases.id,
        purchaseDate: purchases.purchaseDate,
        totalAmount: purchases.totalAmount,
        status: purchases.status,
        paymentMethod: purchases.paymentMethod,
      })
      .from(purchases)
      .where(eq(purchases.bundleId, beneficiary.bundleId))
      .orderBy(desc(purchases.purchaseDate))
      .limit(1)

    return {
      success: true,
      data: {
        beneficiary,
        bundle,
        purchase: purchase || null,
      },
    }
  } catch (error) {
    console.error("Error fetching beneficiary:", error)
    return { success: false, error: "Error al obtener detalles del beneficiario" }
  }
}

export async function updateBeneficiary(
  id: string,
  data: {
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
    organizationId?: string
  },
) {
  try {
    const [updated] = await db
      .update(bundleBeneficiaries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bundleBeneficiaries.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: "Beneficiario no encontrado" }
    }

    // Revalidar tanto la página de paquetes como la de beneficiarios
    revalidatePath(`/packages/${updated.bundleId}`)
    revalidatePath(`/packages/beneficiaries/${id}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating beneficiary:", error)
    return { success: false, error: "Error al actualizar beneficiario" }
  }
}

// Function to export a single beneficiary to Excel
export async function exportBeneficiaryToExcel(id: string, download = false) {
  try {
    // Get beneficiary details
    const [beneficiary] = await db
      .select({
        id: bundleBeneficiaries.id,
        firstName: bundleBeneficiaries.firstName,
        lastName: bundleBeneficiaries.lastName,
        school: bundleBeneficiaries.school,
        level: bundleBeneficiaries.level,
        section: bundleBeneficiaries.section,
        status: bundleBeneficiaries.status,
        bundleId: bundleBeneficiaries.bundleId,
        createdAt: bundleBeneficiaries.createdAt,
        organizationId: bundleBeneficiaries.organizationId,
      })
      .from(bundleBeneficiaries)
      .where(eq(bundleBeneficiaries.id, id))

    if (!beneficiary) {
      return { success: false, error: "Beneficiario no encontrado" }
    }

    // Get bundle details
    const [bundle] = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
      })
      .from(bundles)
      .where(eq(bundles.id, beneficiary.bundleId))

    // Get purchase details
    const [purchase] = await db
      .select({
        id: purchases.id,
        status: purchases.status,
        purchaseDate: purchases.purchaseDate,
        paymentMethod: purchases.paymentMethod,
        totalAmount: purchases.totalAmount,
        clientId: purchases.clientId,
      })
      .from(purchases)
      .where(eq(purchases.bundleId, beneficiary.bundleId))

    // Get client details if purchase exists
    let client = null
    if (purchase) {
      ;[client] = await db
        .select({
          id: clients.id,
          name: clients.name,
        })
        .from(clients)
        .where(eq(clients.id, purchase.clientId))
    }

    // Get organization details if organizationId exists
    let organization = null
    if (beneficiary.organizationId) {
      ;[organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          type: organizations.type,
        })
        .from(organizations)
        .where(eq(organizations.id, beneficiary.organizationId))
    }

    // Format data for export
    const exportData: BeneficiaryExportData = {
      id: beneficiary.id,
      firstName: beneficiary.firstName || "",
      lastName: beneficiary.lastName || "",
      school: beneficiary.school || "",
      level: beneficiary.level || "",
      section: beneficiary.section || "",
      status: beneficiary.status || "",
      createdAt: formatExportDate(beneficiary.createdAt),
      bundleName: bundle?.name || "N/A",
      bundleType: bundle?.type || "N/A",
      bundlePrice: bundle ? formatCurrency(Number(bundle.basePrice)) : "N/A",
      purchaseStatus: purchase?.status || "N/A",
      purchaseDate: purchase ? formatExportDate(purchase.purchaseDate) : "N/A",
      paymentMethod: purchase?.paymentMethod || "N/A",
      totalAmount: purchase ? formatCurrency(Number(purchase.totalAmount)) : "N/A",
      organizationName: organization?.name || "N/A",
      organizationType: organization?.type || "N/A",
    }

    if (download) {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet([exportData])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiario")

      // Generate a unique filename
      const filename = `beneficiario_${beneficiary.id.substring(0, 8)}_${Date.now()}.xlsx`
      const filepath = join(process.cwd(), "public", "exports", filename)

      // Save the file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
      await writeFile(filepath, excelBuffer)

      // Return the download URL
      return {
        success: true,
        downloadUrl: `/exports/${filename}`,
        filename: filename,
        message: "Archivo Excel generado correctamente",
      }
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting beneficiary:", error)
    return { success: false, error: "Error al exportar beneficiario" }
  }
}

// Function to export multiple beneficiaries
export async function exportBeneficiariesToExcel(download = false, ids?: string[]) {
  try {
    // Base query to get all beneficiaries or filter by ids
    let query = db
      .select({
        id: bundleBeneficiaries.id,
        firstName: bundleBeneficiaries.firstName,
        lastName: bundleBeneficiaries.lastName,
        school: bundleBeneficiaries.school,
        level: bundleBeneficiaries.level,
        section: bundleBeneficiaries.section,
        status: bundleBeneficiaries.status,
        bundleId: bundleBeneficiaries.bundleId,
        createdAt: bundleBeneficiaries.createdAt,
        organizationId: bundleBeneficiaries.organizationId,
      })
      .from(bundleBeneficiaries)

    // Apply filter if ids are provided
    if (ids && ids.length > 0) {
      query = query.where(inArray(bundleBeneficiaries.id, ids))
    }

    const beneficiaries = await query

    if (beneficiaries.length === 0) {
      return { success: false, error: "No se encontraron beneficiarios" }
    }

    // Get all bundle ids
    const bundleIds = [...new Set(beneficiaries.map((b) => b.bundleId))]

    // Get all bundles in one query
    const bundlesData = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        basePrice: bundles.basePrice,
        type: bundles.type,
      })
      .from(bundles)
      .where(inArray(bundles.id, bundleIds))

    // Create a map for quick lookup
    const bundlesMap = new Map(bundlesData.map((b) => [b.id, b]))

    // Get all organization ids
    const orgIds = beneficiaries.map((b) => b.organizationId).filter((id): id is string => id !== null)

    // Get all organizations in one query if there are any
    let orgsMap = new Map()
    if (orgIds.length > 0) {
      const orgsData = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          type: organizations.type,
        })
        .from(organizations)
        .where(inArray(organizations.id, orgIds))

      orgsMap = new Map(orgsData.map((o) => [o.id, o]))
    }

    // Get all purchases for these bundles
    const purchasesData = await db
      .select({
        id: purchases.id,
        bundleId: purchases.bundleId,
        status: purchases.status,
        purchaseDate: purchases.purchaseDate,
        paymentMethod: purchases.paymentMethod,
        totalAmount: purchases.totalAmount,
      })
      .from(purchases)
      .where(inArray(purchases.bundleId, bundleIds))

    // Create a map of bundle id to purchase
    const purchasesMap = new Map()
    for (const purchase of purchasesData) {
      purchasesMap.set(purchase.bundleId, purchase)
    }

    // Format data for export
    const exportData: BeneficiaryExportData[] = beneficiaries.map((beneficiary) => {
      const bundle = bundlesMap.get(beneficiary.bundleId)
      const purchase = purchasesMap.get(beneficiary.bundleId)
      const organization = beneficiary.organizationId ? orgsMap.get(beneficiary.organizationId) : null

      return {
        id: beneficiary.id,
        firstName: beneficiary.firstName || "",
        lastName: beneficiary.lastName || "",
        school: beneficiary.school || "",
        level: beneficiary.level || "",
        section: beneficiary.section || "",
        status: beneficiary.status || "",
        createdAt: formatExportDate(beneficiary.createdAt),
        bundleName: bundle?.name || "N/A",
        bundleType: bundle?.type || "N/A",
        bundlePrice: bundle ? formatCurrency(Number(bundle.basePrice)) : "N/A",
        purchaseStatus: purchase?.status || "N/A",
        purchaseDate: purchase ? formatExportDate(purchase.purchaseDate) : "N/A",
        paymentMethod: purchase?.paymentMethod || "N/A",
        totalAmount: purchase ? formatCurrency(Number(purchase.totalAmount)) : "N/A",
        organizationName: organization?.name || "N/A",
        organizationType: organization?.type || "N/A",
      }
    })

    if (download) {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiarios")

      // Generate a unique filename
      const filename = `beneficiarios_${uuidv4().substring(0, 8)}_${Date.now()}.xlsx`
      const filepath = join(process.cwd(), "public", "exports", filename)

      // Save the file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
      await writeFile(filepath, excelBuffer)

      // Return the download URL
      return {
        success: true,
        downloadUrl: `/exports/${filename}`,
        filename: filename,
        message: `Se exportaron ${exportData.length} beneficiarios correctamente`,
      }
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting beneficiaries:", error)
    return { success: false, error: "Error al exportar beneficiarios" }
  }
}

