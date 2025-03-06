'use server';

import { db } from "@/db";
import { bundles, bundleBeneficiaries, purchases } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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