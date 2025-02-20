export interface ContactInfo {
  email?: string;
  phone?: string;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  phone?: string;
  whatsapp?: string;
  role: 'PARENT' | 'EMPLOYEE' | 'INDIVIDUAL';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: 'SCHOOL' | 'COMPANY' | 'OTHER';
  address?: string;
  contactInfo: ContactInfo;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  clients: Client[];
}

export interface OrganizationListData {
  data: Organization[];
  error?: string;
} 