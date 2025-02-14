export type InventoryTransactionType = "IN" | "OUT" | "ADJUSTMENT" | "RESERVATION" | "FULFILLMENT";

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
}

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