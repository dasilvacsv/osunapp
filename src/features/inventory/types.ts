// Core inventory types
export type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  basePrice: string;
  currentStock: number | null;
  minimumStock: number | null;
  metadata: Record<string, unknown> | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

export type CreateInventoryItemInput = {
  name: string;
  description?: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  basePrice: string;
  currentStock?: number;
  minimumStock?: number;
  metadata?: Record<string, unknown>;
};

export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput> & {
  id: string;
};

export type StockLevelUpdate = {
  itemId: string;
  quantity: number;
  adjustmentType: 'INCREMENT' | 'DECREMENT' | 'SET';
};

export type InventoryHistoryEntry = {
  id: string;
  itemId: string;
  changeType: 'STOCK_ADJUSTMENT' | 'PURCHASE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type InventoryItemWithStock = InventoryItem & {
  stockHistory: InventoryHistoryEntry[];
  isLowStock: boolean;
};