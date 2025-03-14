import { 
  clients, 
  organizations, 
  beneficiarios, 
  purchases, 
  bundles,
  certificates
} from "@/db/schema";

// Define the purchase status type from schema
export type PurchaseStatus = "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type CertificateStatus = "GENERATED" | "NOT_GENERATED" | "NEEDS_REVISION" | "APPROVED";

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
  beneficiarioGrade: string | null;
  beneficiarioSection: string | null;
  
  // Bundle info
  bundleId: string | null;
  bundleName: string | null;
  
  // Organization info
  organizationId: string | null;
  organizationName: string | null;
  organizationType: string | null;
  
  // Certificate info
  certificateId: string | null;
  certificateStatus: CertificateStatus | null;
  certificateFileUrl: string | null;
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
export type Certificate = typeof certificates.$inferSelect;

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

// Ficha Data for PDF generation
export interface BundleItemData {
  name: string;
  description: string;
  quantity: number;
}

export interface PaymentData {
  amount: number;
  date: Date | null;
  method: string;
  status: string;
}

export interface FichaData {
  // Purchase info
  purchaseId: string;
  purchaseDate: Date | null;
  totalAmount: number;
  status: PurchaseStatus;
  isPaid: boolean;
  
  // Client info
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  clientWhatsapp: string;
  clientEmail: string;
  
  // Beneficiary info
  beneficiarioName: string;
  beneficiarioFirstName: string;
  beneficiarioLastName: string;
  beneficiarioGrade: string;
  beneficiarioSection: string;
  beneficiarioSchool: string;
  
  // Bundle info
  bundleName: string;
  bundleItems: BundleItemData[];
  
  // Organization info
  organizationName: string;
  
  // Payment info
  totalPaid: number;
  remaining: number;
  payments: PaymentData[];
} 