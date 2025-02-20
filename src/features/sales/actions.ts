// actions/sales/actions.ts
'use server';
import { db } from "@/db";
import { purchases, purchaseItems, inventoryItems, inventoryTransactions, clients } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPurchaseDetails(id: string) {
  try {
    const result = await db
      .select({
        purchase: purchases,
        client: clients,
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
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .groupBy(purchases.id, clients.id);

    if (result.length === 0) return { success: false, error: "Venta no encontrada" };

    return {
      success: true,
      data: {
        ...result[0].purchase,
        client: result[0].client,
        items: result[0].items,
      },
    };
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    return { success: false, error: "Error al obtener detalles de la venta" };
  }
}

export async function createPurchase(data: {
  clientId: string;
  items: Array<{ itemId: string; quantity: number }>;
  paymentMethod: string;
}) {
  try {
    // Validar stock y obtener precios primero
    const itemsWithStock = await Promise.all(
      data.items.map(async (item) => {
        const [inventoryItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item.itemId));

        if (!inventoryItem) throw new Error(`Producto no encontrado: ${item.itemId}`);
        if (inventoryItem.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${inventoryItem.name} (${inventoryItem.currentStock} disponibles)`);
        }

        return {
          ...item,
          unitPrice: inventoryItem.basePrice.toString(),
          totalPrice: (Number(inventoryItem.basePrice) * item.quantity).toString(),
        };
      })
    );

    // Calcular total
    const totalAmount = itemsWithStock.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    // Crear la compra
    const [purchase] = await db.insert(purchases).values({
      clientId: data.clientId,
      totalAmount,
      paymentMethod: data.paymentMethod,
      status: "COMPLETED",
      purchaseDate: new Date(),
    }).returning();

    // Crear items de compra
    await db.insert(purchaseItems).values(
      itemsWithStock.map((item) => ({
        purchaseId: purchase.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }))
    );

    // Actualizar inventario
    for (const item of data.items) {
      await db.update(inventoryItems)
        .set({ currentStock: sql`${inventoryItems.currentStock} - ${item.quantity}` })
        .where(eq(inventoryItems.id, item.itemId));

      await db.insert(inventoryTransactions).values({
        itemId: item.itemId,
        quantity: -item.quantity,
        transactionType: 'SALE',
        notes: `Venta #${purchase.id}`,
        createdAt: new Date(),
      });
    }

    // Revalidar rutas
    revalidatePath('/sales');
    revalidatePath(`/sales/${purchase.id}`);

    return { success: true, data: purchase };
  } catch (error) {
    console.error("Error creating purchase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar la venta",
    };
  }
}

export async function getSalesData() {
  try {
    const sales = await db
      .select({
        purchase: purchases,
        client: clients,
        items: sql`
          json_agg(json_build_object(
            'inventoryItem', ${inventoryItems},
            'quantity', ${purchaseItems.quantity},
            'unitPrice', ${purchaseItems.unitPrice}
          ))
        `,
      })
      .from(purchases)
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .leftJoin(inventoryItems, eq(purchaseItems.itemId, inventoryItems.id))
      .groupBy(purchases.id, clients.id);

    return {
      success: true,
      data: sales.map((sale) => ({
        ...sale.purchase,
        client: sale.client,
        items: sale.items,
        totalAmount: sale.purchase.totalAmount,
      })),
    };
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return { success: false, error: "Failed to fetch sales data" };
  }
}

export async function updatePurchaseStatus(id: string, newStatus: string) {
  try {
    // Validar el nuevo estado
    const validStatuses = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
    if (!validStatuses.includes(newStatus as typeof validStatuses[number])) {
      return { success: false, error: "Estado inválido" };
    }

    // Asegurar que el tipo sea compatible con el enum de Drizzle
    const status = newStatus as typeof validStatuses[number];

    const [updatedPurchase] = await db.update(purchases)
      .set({
        status: status, // Ahora TypeScript sabe que este valor es válido
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning();

    // Revalidar rutas relevantes
    revalidatePath('/sales');
    revalidatePath(`/sales/${id}`);

    return {
      success: true,
      data: updatedPurchase,
    };
  } catch (error) {
    console.error("Error updating status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el estado",
    };
  }
}