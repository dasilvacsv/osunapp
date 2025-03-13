export interface InventoryItem {
  id: string;
  name: string;
  basePrice: string | number;
  currentStock: number;
  sku?: string;
  status: "ACTIVE" | "INACTIVE";
  allowPreSale?: boolean;
  description?: string;
  metadata?: any;
}

export interface BundleItem {
  id: string;
  quantity: number;
  overridePrice: string | number | null;
  item: InventoryItem;
}

export interface Bundle {
  id: string;
  name: string;
  basePrice: string | number;
  type: string;
  status: "ACTIVE" | "INACTIVE" | null;
  discountPercentage?: number;
  items: Array<{
    id: string;
    quantity: number;
    overridePrice?: string | number;
    item: InventoryItem;
  }>;
}

export interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  overridePrice?: number;
  stock?: number;
  allowPreSale?: boolean;
  isFromBundle?: boolean;
  bundleId?: string;
} 