import { z } from "zod"
import { inventoryItemTypeEnum, inventoryItemStatusEnum } from "@/db/schema"

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  type: z.enum(inventoryItemTypeEnum.enumValues),
  basePrice: z.number().min(0, "El precio base debe ser mayor o igual a 0"),
  currentStock: z.number().int().min(0).optional().default(0),
  reservedStock: z.number().int().min(0).optional().default(0),
  minimumStock: z.number().int().min(0).optional().default(0),
  status: z.enum(inventoryItemStatusEnum.enumValues),
  description: z.string().optional(),
  expectedRestock: z.date().optional(),
})

export const stockTransactionSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number(),
  notes: z.string().optional(),
  reference: z.record(z.unknown()).optional(),
  transactionType: z.enum(["INITIAL", "IN", "OUT", "ADJUSTMENT", "RESERVATION", "FULFILLMENT"]).optional(),
})

export const bundleCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export const bundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.number().min(1),
      overridePrice: z.number().min(0).optional(),
    }),
  ),
  totalBasePrice: z.number().min(0),
  savingsPercentage: z.number().min(0).max(100),
})

// Updated purchase item schema with better error messages
export const purchaseItemSchema = z.object({
  itemId: z.string().uuid("ID de artículo inválido"),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unitCost: z.coerce.number().nonnegative("El costo unitario no puede ser negativo"),
})

// Updated purchase schema with better handling of optional fields
export const purchaseSchema = z.object({
  supplierName: z.string().min(1, "El nombre del proveedor es requerido"),
  notes: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "Debe incluir al menos un artículo"),
})

// Form-specific schema (simpler version for the form itself)
export const purchaseFormSchema = z.object({
  supplierName: z.string().min(1, "El nombre del proveedor es requerido"),
  notes: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
})