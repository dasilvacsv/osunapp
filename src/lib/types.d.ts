export interface Client {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  contactInfo: {
    email: string;
    phone?: string;
  } | null;
  organizationId: string | null;
  organization?: {
    id: string;
    name: string;
    type: "SCHOOL" | "COMPANY" | "OTHER";
    address?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
    };
    status: "ACTIVE" | "INACTIVE";
  };
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  type: "SCHOOL" | "COMPANY" | "OTHER";
  address?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface InventoryItem {
  id: string
  name: string
  sku: string | null
  description: string | null
  type: "PHYSICAL" | "DIGITAL" | "SERVICE"
  basePrice: string
  currentStock: number
  reservedStock: number
  minimumStock: number
  expectedRestock: Date | null
  metadata: Record<string, any> | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: Date
  updatedAt: Date
}

export interface Sale {
  id: string;
  client: Client;
  purchaseDate: Date;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  paymentMethod: string;
  items: {
    inventoryItem: InventoryItem;
    quantity: number;
    unitPrice: number;
  }[];
  transactionReference?: string;
  bookingMethod?: string;
}