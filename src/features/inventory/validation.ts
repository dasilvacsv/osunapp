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