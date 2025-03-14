import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  bundles
} from "@/db/schema";

// Define the purchase status type from schema
export type PurchaseStatus = "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

// Basic types for the certificado feature
export interface CertificadoSale {
  id: string;
  purchaseDate: Date | null;
  totalAmount: string | null;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus | null;
  isPaid: boolean | null;
  
  // Client info
  clientId: string;
  clientName: string | null;
  
  // Beneficiary info
  beneficiarioId: string | null;
  beneficiarioFirstName: string | null;
  beneficiarioLastName: string | null;
  
  // Bundle info
  bundleId: string | null;
  bundleName: string | null;
  
  // Organization info
  organizationId: string | null;
  organizationName: string | null;
  organizationType: string | null;
}

export interface OrganizationSalesGroup {
  id: string | null;
  name: string | null;
  type: string | null;
  sales: CertificadoSale[];
  totalSales: number;
  totalAmount: number;
}

// Infer types from schema
export type Client = typeof clients.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Beneficiario = typeof beneficiarios.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;

// Form data types
export interface CertificadoFormData {
  clientId: string;
  beneficiarioId?: string;
  bundleId?: string;
  organizationId?: string;
  totalAmount: number;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  isPaid: boolean;
  purchaseDate: Date;
}

// Response types
export interface CertificadoResponse {
  success: boolean;
  data?: OrganizationSalesGroup[];
  error?: string;
} 