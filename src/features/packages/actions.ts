'use server';

import { db } from "@/db";
import { bundles, bundleBeneficiaries, purchases } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type BundleWithBeneficiaries = typeof bundles.$inferSelect & {
  beneficiaries: Array<typeof bundleBeneficiaries.$inferSelect>;
  salesData: {
    totalSales: number;
    totalRevenue: string;
    lastSaleDate: Date | null;
  };
};

export async function getBundleDetails(id: string) {
  try {
    const result = await db
      .select({
        bundle: bundles,
        beneficiaries: sql<Array<typeof bundleBeneficiaries.$inferSelect>>`
          COALESCE(
            json_agg(${bundleBeneficiaries.*}) FILTER (WHERE ${bundleBeneficiaries.id} IS NOT NULL),
            '[]'
          )
        `,
        salesData: sql`
          json_build_object(
            'totalSales', COUNT(DISTINCT ${purchases.id}),
            'totalRevenue', COALESCE(SUM(${purchases.totalAmount}), 0),
            'lastSaleDate', MAX(${purchases.purchaseDate})
          )
        `
      })
      .from(bundles)
      .leftJoin(bundleBeneficiaries, eq(bundles.id, bundleBeneficiaries.bundleId))
      .leftJoin(purchases, eq(bundles.id, purchases.bundleId))
      .where(eq(bundles.id, id))
      .groupBy(bundles.id);

    if (result.length === 0) {
      return { success: false, error: "Paquete no encontrado" };
    }

    return {
      success: true,
      data: {
        ...result[0].bundle,
        beneficiaries: result[0].beneficiaries,
        salesData: result[0].salesData
      } as BundleWithBeneficiaries
    };
  } catch (error) {
    console.error("Error fetching bundle details:", error);
    return { success: false, error: "Error al obtener detalles del paquete" };
  }
}

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
        ...data,
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