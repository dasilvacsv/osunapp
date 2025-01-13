export interface Client {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;    // Add this
  whatsapp: string | null; // Add this
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
interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
}


