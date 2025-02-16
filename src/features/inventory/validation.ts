import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().regex(/^[A-Z0-9]+-[A-Z0-9]+$/),
  description: z.string().optional(),
  type: z.enum(["PHYSICAL", "DIGITAL", "SERVICE"]),
  basePrice: z.number().positive(),
  minimumStock: z.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

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