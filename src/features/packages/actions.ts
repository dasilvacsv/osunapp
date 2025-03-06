// features/packages/actions.ts
'use server';
import { db } from "@/db";
import { bundles, bundleBeneficiaries, purchases } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { BundleWithBeneficiaries, BeneficiaryDetails } from "./types";

export async function getBundleDetails(id: string): Promise<{
  success: boolean;
  data?: BundleWithBeneficiaries;
  error?: string;
}> {
  try {
    const result = await db
      .select({
        bundle: bundles,
        beneficiaries: sql`
          COALESCE(
            json_agg(${bundleBeneficiaries} ORDER BY ${bundleBeneficiaries.createdAt}) 
            FILTER (WHERE ${bundleBeneficiaries.id} IS NOT NULL),
            '[]'::json
          )
        `,
        salesData: sql`
          json_build_object(
            'totalSales', ${bundles.totalSales},
            'totalRevenue', ${bundles.totalRevenue},
            'lastSaleDate', ${bundles.lastSaleDate}
          )
        `
      })
      .from(bundles)
      .leftJoin(bundleBeneficiaries, eq(bundles.id, bundleBeneficiaries.bundleId))
      .where(eq(bundles.id, id))
      .groupBy(bundles.id);

    if (result.length === 0) {
      return { success: false, error: "Paquete no encontrado" };
    }

    const bundleData = result[0];
    
    return {
      success: true,
      data: {
        ...bundleData.bundle,
        totalSales: Number(bundleData.bundle.totalSales),
        totalRevenue: bundleData.bundle.totalRevenue,
        lastSaleDate: bundleData.bundle.lastSaleDate,
        beneficiaries: bundleData.beneficiaries
      }
    };
  } catch (error) {
    console.error("Error fetching bundle details:", error);
    return { success: false, error: "Error al obtener detalles del paquete" };
  }
}

export async function getBeneficiaryDetails(id: string): Promise<{
  success: boolean;
  data?: BeneficiaryDetails;
  error?: string;
}> {
  try {
    const [result] = await db
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
      .leftJoin(purchases, eq(bundleBeneficiaries.id, purchases.childId))
      .where(eq(bundleBeneficiaries.id, id));

    if (!result) {
      return { success: false, error: "Beneficiario no encontrado" };
    }

    return {
      success: true,
      data: {
        beneficiary: result.beneficiary,
        bundle: result.bundle,
        purchase: result.purchase
      }
    };
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    return { success: false, error: "Error al obtener detalles del beneficiario" };
  }
}