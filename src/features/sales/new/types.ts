export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  currentStock: number;
  basePrice: string | number;
  status: "ACTIVE" | "INACTIVE";
  metadata?: Record<string, any>;
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
  description: string | null;
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR";
  basePrice: string | number;
  status: "ACTIVE" | "INACTIVE";
  items: BundleItem[];
}

export interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock?: number;
  allowPreSale?: boolean;
} 