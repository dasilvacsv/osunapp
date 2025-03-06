// features/packages/types.ts
// En actions.ts o types.ts
export type BundleWithBeneficiaries = {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    discountPercentage: number | null;
    salesData: {
      totalSales: number;
      totalRevenue: string;
      lastSaleDate: Date | null;
    };
    beneficiaries: Array<{
      id: string;
      firstName: string;
      lastName: string;
      school: string;
      level: string;
      section: string;
      status: "ACTIVE" | "INACTIVE";
      createdAt: Date;
      purchase: {
        id: string;
        purchaseDate: Date;
        totalAmount: number;
      } | null;
    }>;
  };
  
  export type BundleBeneficiary = {
    id: string;
    firstName: string;
    lastName: string;
    school: string;
    level: string;
    section: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: Date;
    bundleId: string;
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