import { z } from "zod";

export type InventoryTransactionType = "INITIAL" | "IN" | "OUT" | "ADJUSTMENT" | "RESERVATION" | "FULFILLMENT";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  basePrice: number;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  expectedRestock?: Date;
  metadata?: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  allowPreSale: boolean, 
}

export const StockTransactionInputSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  notes: z.string().optional()
});

export interface InventoryTransaction {
  id: string;
  itemId: string;
  quantity: number;
  transactionType: InventoryTransactionType;
  reference?: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export type CreateInventoryItemInput = Omit<
  InventoryItem,
  "id" | "createdAt" | "updatedAt" | "currentStock" | "reservedStock"
>;

export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput>;

export type StockTransactionInput = {
  itemId: string;
  quantity: number;
  notes?: string;
  reference?: Record<string, unknown>;
};

export interface BundleCategory {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBundleCategoryInput = Omit<
  BundleCategory,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface BundleWithItems extends Bundle {
  items: {
    item: InventoryItem;
    quantity: number;
    overridePrice?: number;
  }[];
  totalBasePrice: number;
  totalDiscountedPrice: number;
  savings: number;
  savingsPercentage: number;
}

export interface Bundle {
  items: any;
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  type: 'SCHOOL_PACKAGE' | 'ORGANIZATION_PACKAGE' | 'REGULAR';
  basePrice: number;
  discountPercentage?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBundleInput = {
  name: string;
  description?: string;
  categoryId: string;
  organizationId?: string | null;
  items: {
    itemId: string;
    quantity: number;
    overridePrice?: number;
  }[];
  totalBasePrice: number;
  bundlePrice: number;
  savingsPercentage: number;
};


