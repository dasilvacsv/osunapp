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
export type CurrencyType = "USD" | "BS";  // Nuevo tipo para moneda

// Basic types for the certificado feature
export interface CertificadoSale {
  id: string;
  purchaseDate: Date | null;
  totalAmount: string | null;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus | null;
  isPaid: boolean | null;
  currencyType: CurrencyType;  // Nuevo campo
  
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
  currencyType: CurrencyType;  // Nuevo campo para totales
}

// Infer types from schema (actualizados con currencyType)
export type Client = typeof clients.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Beneficiario = typeof beneficiarios.$inferSelect;
export type Purchase = typeof purchases.$inferSelect & {
  currencyType: CurrencyType;
};
export type Bundle = typeof bundles.$inferSelect & {
  currencyType: CurrencyType;
};
export type Certificate = typeof certificates.$inferSelect;

// Form data types actualizados
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
  currencyType: CurrencyType;  // Nuevo campo
}

// Response types actualizados
export interface CertificadoResponse {
  success: boolean;
  data?: OrganizationSalesGroup[];
  error?: string;
} 

// Ficha Data for PDF generation actualizado
export interface BundleItemData {
  name: string;
  description: string;
  quantity: number;
  currencyType: CurrencyType;  // Nuevo campo
}

export interface PaymentData {
  amount: number;
  date: Date | null;
  method: string;
  status: string;
  currencyType: CurrencyType;  // Nuevo campo
}

export interface FichaData {
  // Purchase info
  purchaseId: string;
  purchaseDate: Date | null;
  totalAmount: number;
  status: PurchaseStatus;
  isPaid: boolean;
  currencyType: CurrencyType;  // Nuevo campo
  
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