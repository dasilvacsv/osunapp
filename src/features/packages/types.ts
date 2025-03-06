// features/packages/types.ts
export type BundleWithBeneficiaries = {
    id: string;
    name: string;
    description: string | null;
    basePrice: string;
    discountPercentage: string | null;
    status: "ACTIVE" | "INACTIVE";
    totalSales: number;
    totalRevenue: string;
    lastSaleDate: Date | null;
    beneficiaries: Array<{
      id: string;
      firstName: string;
      lastName: string;
      school: string;
      level: string;
      section: string;
      status: "ACTIVE" | "INACTIVE";
      createdAt: Date;
    }>;
  };
  
  export type BeneficiaryDetails = {
    beneficiary: {
      id: string;
      firstName: string;
      lastName: string;
      school: string;
      level: string;
      section: string;
      status: "ACTIVE" | "INACTIVE";
      createdAt: Date;
    };
    bundle: {
      id: string;
      name: string;
      basePrice: string;
    } | null;
    purchase: {
      id: string;
      purchaseDate: Date | null;
      totalAmount: string;
    } | null;
  };