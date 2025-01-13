export interface Client {
  id: string;
  name: string;
  contactInfo: {
    email: string;
    phone?: string;
  } | null;
  organizationId: string | null;
  role: "PARENT" | "EMPLOYEE" | "INDIVIDUAL";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date | null;
  updatedAt: Date | null;
}