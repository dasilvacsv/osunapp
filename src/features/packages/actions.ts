'use server';

import { db } from "@/db";
import { bundles, bundleBeneficiaries, purchases, clients } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// En actions.ts o types.ts
export type BundleWithBeneficiaries = {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    discountPercentage: number | null;
    salesData: {
      totalSales: number;
      totalRevenue: string;
      lastSaleDate: Date | null;
    };
    beneficiaries: Array<{
      id: string;
      firstName: string;
      lastName: string;
      school: string;
      level: string;
      section: string;
      status: "ACTIVE" | "INACTIVE";
      createdAt: Date;
      purchase: {
        id: string;
        purchaseDate: Date;
        totalAmount: number;
      } | null;
    }>;
  };
  

export async function addBundleBeneficiary(bundleId: string, data: {
    firstName: string;
    lastName: string;
    school: string;
    level: string;
    section: string;
  }) {
    try {
      const [beneficiary] = await db.insert(bundleBeneficiaries)
        .values({
          bundleId,
          firstName: data.firstName,
          lastName: data.lastName,
          school: data.school,
          level: data.level,
          section: data.section,
          status: "ACTIVE"
        })
        .returning();
  
      revalidatePath(`/packages/${bundleId}`);
      return { success: true, data: beneficiary };
    } catch (error) {
      console.error("Error adding beneficiary:", error);
      return { success: false, error: "Error al agregar beneficiario" };
    }
  }
  
  export async function removeBundleBeneficiary(id: string) {
    try {
      const [beneficiary] = await db.delete(bundleBeneficiaries)
        .where(eq(bundleBeneficiaries.id, id))
        .returning();
  
      if (!beneficiary) {
        return { success: false, error: "Beneficiario no encontrado" };
      }
  
      revalidatePath(`/packages/${beneficiary.bundleId}`);
      return { success: true };
    } catch (error) {
      console.error("Error removing beneficiary:", error);
      return { success: false, error: "Error al eliminar beneficiario" };
    }
  }

export async function getPackagesWithStats() {
  try {
    const result = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        type: bundles.type,
        basePrice: bundles.basePrice,
        status: bundles.status,
        totalSales: sql<number>`COUNT(DISTINCT ${purchases.id})`,
        totalRevenue: sql<string>`COALESCE(SUM(${purchases.totalAmount}), 0)::text`,
        beneficiariesCount: sql<number>`COUNT(DISTINCT ${bundleBeneficiaries.id})`,
      })
      .from(bundles)
      .leftJoin(purchases, eq(bundles.id, purchases.bundleId))
      .leftJoin(bundleBeneficiaries, eq(bundles.id, bundleBeneficiaries.bundleId))
      .groupBy(bundles.id);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching packages:", error);
    return { success: false, error: "Error al obtener los paquetes" };
  }
}

export async function getBundleDetails(id: string) {
    try {
      const [bundle] = await db
        .select({
          id: bundles.id,
          name: bundles.name,
          description: bundles.description,
          basePrice: bundles.basePrice,
          discountPercentage: bundles.discountPercentage,
          salesData: {
            totalSales: sql<number>`COUNT(DISTINCT ${purchases.id})`,
            totalRevenue: sql<string>`COALESCE(SUM(${purchases.totalAmount}), 0)::text`,
            lastSaleDate: sql<Date | null>`MAX(${purchases.purchaseDate})`,
          },
          beneficiaries: sql<Array<unknown>>`
            COALESCE(
              JSON_AGG(
                DISTINCT jsonb_build_object(
                  'id', ${bundleBeneficiaries.id},
                  'firstName', ${bundleBeneficiaries.firstName},
                  'lastName', ${bundleBeneficiaries.lastName},
                  'school', ${bundleBeneficiaries.school},
                  'level', ${bundleBeneficiaries.level},
                  'section', ${bundleBeneficiaries.section},
                  'status', ${bundleBeneficiaries.status},
                  'createdAt', ${bundleBeneficiaries.createdAt},
                  'purchase', (
                    SELECT jsonb_build_object(
                      'id', ${purchases.id},
                      'purchaseDate', ${purchases.purchaseDate},
                      'totalAmount', ${purchases.totalAmount}
                    )
                    FROM ${purchases}
                    WHERE ${purchases.bundleId} = ${bundles.id}
                      AND ${purchases.clientId} = ${clients.id}
                    LIMIT 1
                  )
                )
              ), 
              '[]'
            )`
        })
        .from(bundles)
        .leftJoin(bundleBeneficiaries, eq(bundles.id, bundleBeneficiaries.bundleId))
        .leftJoin(purchases, eq(bundles.id, purchases.bundleId))
        .leftJoin(clients, eq(purchases.clientId, clients.id))
        .where(eq(bundles.id, id))
        .groupBy(bundles.id);
  
      if (!bundle) {
        return { success: false, error: "Paquete no encontrado" };
      }
  
      return {
        success: true,
        data: {
          ...bundle,
          salesData: {
            totalSales: Number(bundle.salesData.totalSales),
            totalRevenue: bundle.salesData.totalRevenue,
            lastSaleDate: bundle.salesData.lastSaleDate || null,
          },
          beneficiaries: bundle.beneficiaries.map((b: any) => ({
            ...b,
            purchase: b.purchase || null,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching bundle details:", error);
      return { success: false, error: "Error al obtener detalles del paquete" };
    }
  }

export async function getBeneficiaryDetails(id: string) {
  try {
    const [beneficiary] = await db
      .select({
        beneficiary: bundleBeneficiaries,
        bundle: {
          id: bundles.id,
          name: bundles.name,
          basePrice: bundles.basePrice,
        },
        purchase: {
          id: purchases.id,
          purchaseDate: purchases.purchaseDate,
          totalAmount: purchases.totalAmount,
        },
      })
      .from(bundleBeneficiaries)
      .leftJoin(bundles, eq(bundleBeneficiaries.bundleId, bundles.id))
      .leftJoin(purchases, eq(bundles.id, purchases.bundleId))
      .where(eq(bundleBeneficiaries.id, id));

    if (!beneficiary) {
      return { success: false, error: "Beneficiario no encontrado" };
    }

    return { success: true, data: beneficiary };
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    return { success: false, error: "Error al obtener detalles del beneficiario" };
  }
}

export async function updateBeneficiary(id: string, data: {
  firstName: string;
  lastName: string;
  school: string;
  level: string;
  section: string;
}) {
  try {
    const [updated] = await db
      .update(bundleBeneficiaries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bundleBeneficiaries.id, id))
      .returning();

    revalidatePath('/packages');
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    return { success: false, error: "Error al actualizar beneficiario" };
  }
}