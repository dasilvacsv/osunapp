import { z } from "zod";
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
})


export const stockTransactionSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number(),
  notes: z.string().optional(),
  reference: z.record(z.unknown()).optional(),
});

export const bundleCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const bundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().min(1),
    overridePrice: z.number().min(0).optional(),
  })),
  totalBasePrice: z.number().min(0),
  savingsPercentage: z.number().min(0).max(100),
}); 

