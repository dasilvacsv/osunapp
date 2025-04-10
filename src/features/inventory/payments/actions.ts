import { db } from "@/db";
import { payments, clients, purchases, purchaseItems, inventoryItems } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

interface GetPaymentDataOptions {
  page?: number;
  pageSize?: number;
}

export async function getPaymentData(options: GetPaymentDataOptions = {}) {
  const { page = 1, pageSize = 10 } = options;
  const offset = (page - 1) * pageSize;

  try {
    // Consulta principal con paginación
    const paymentsData = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currencyType: payments.currencyType,
        status: payments.status,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.paymentMethod,
        transactionReference: payments.transactionReference,
        notes: payments.notes,
        purchaseId: payments.purchaseId,
        conversionRate: payments.conversionRate,
        client: {
          id: clients.id,
          name: clients.name,
          document: clients.document,
          phone: clients.phone,
          whatsapp: clients.whatsapp,
        },
        purchase: {
          id: purchases.id,
          totalAmount: purchases.totalAmount,
          status: purchases.status,
          paymentStatus: purchases.paymentStatus,
          paymentType: purchases.paymentType,
          isPaid: purchases.isPaid,
          currencyType: purchases.currencyType,
          conversionRate: purchases.conversionRate,
        },
      })
      .from(payments)
      .leftJoin(purchases, eq(payments.purchaseId, purchases.id))
      .leftJoin(clients, eq(purchases.clientId, clients.id))
      .orderBy(desc(payments.paymentDate))
      .limit(pageSize)
      .offset(offset);

    // Procesamiento de datos
    const enhancedPaymentsData = await Promise.all(
      paymentsData.map(async (payment) => {
        try {
          // Obtener items de la compra
          const purchaseItemsData = await db
            .select({
              id: purchaseItems.id,
              quantity: purchaseItems.quantity,
              unitPrice: purchaseItems.unitPrice,
              totalPrice: purchaseItems.totalPrice,
              itemId: purchaseItems.itemId,
            })
            .from(purchaseItems)
            .where(eq(purchaseItems.purchaseId, payment.purchaseId));

          // Obtener detalles de inventario
          const itemDetails = await Promise.all(
            purchaseItemsData.map(async (item) => {
              try {
                const inventoryItem = await db
                  .select({
                    id: inventoryItems.id,
                    name: inventoryItems.name,
                    sku: inventoryItems.sku,
                    type: inventoryItems.type,
                  })
                  .from(inventoryItems)
                  .where(eq(inventoryItems.id, item.itemId))
                  .then((rows) => rows[0]);

                return {
                  ...item,
                  inventoryItem,
                };
              } catch (error) {
                console.error("Error fetching inventory item:", error);
                return {
                  ...item,
                  inventoryItem: null,
                };
              }
            })
          );

          // Calcular monto pendiente
          const totalPaid = await db
            .select({
              total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
            })
            .from(payments)
            .where(eq(payments.purchaseId, payment.purchaseId))
            .then((result) => result[0]?.total || 0);

          const pendingAmount = payment.purchase?.totalAmount
            ? Number(payment.purchase.totalAmount) - Number(totalPaid)
            : 0;

          return {
            ...payment,
            pendingAmount: pendingAmount.toString(),
            purchaseDetails: itemDetails,
          };
        } catch (error) {
          console.error("Error processing payment:", error);
          return {
            ...payment,
            pendingAmount: "0",
            purchaseDetails: [],
          };
        }
      })
    );

    // Métricas globales
    const [metrics, paymentMethodMetrics, totalCount] = await Promise.all([
      // Métricas generales
      db
        .select({
          totalUSD: sql<number>`
            COALESCE(SUM(
              CASE 
                WHEN ${payments.currencyType} = 'USD' THEN ${payments.amount} 
                ELSE ${payments.amount} / NULLIF(${payments.conversionRate}, 0) 
              END
            ), 0)
          `,
          totalBS: sql<number>`
            COALESCE(SUM(
              CASE 
                WHEN ${payments.currencyType} = 'BS' THEN ${payments.amount} 
                ELSE ${payments.amount} * NULLIF(${payments.conversionRate}, 0) 
              END
            ), 0)
          `,
          pendingPayments: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'PENDING')`,
          overduePayments: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'OVERDUE')`,
          totalPaid: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'PAID')`,
          totalCancelled: sql<number>`COUNT(*) FILTER (WHERE ${payments.status} = 'CANCELLED')`,
        })
        .from(payments),

      // Métricas por método de pago
      db
        .select({
          method: payments.paymentMethod,
          count: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`SUM(${payments.amount})`,
        })
        .from(payments)
        .where(sql`${payments.paymentMethod} IS NOT NULL`)
        .groupBy(payments.paymentMethod),

      // Total de registros para paginación
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(payments)
        .then((res) => res[0]?.count || 0),
    ]);

    return {
      payments: enhancedPaymentsData,
      metrics: metrics[0],
      paymentMethodMetrics,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error("Error fetching payment data:", error);
    throw new Error("Error fetching payment data");
  }
}