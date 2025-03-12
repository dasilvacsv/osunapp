import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CreditCard, DollarSign, Mail, MapPin, Package, Phone, ShoppingCart, Truck, User, Users, School } from "lucide-react"

// Define the interface for the component props
interface PurchaseDetailsProps {
  purchase: {
    id: string;
    status: string;
    totalAmount: number;
    purchaseDate: Date;
    paymentMethod: string;
    transactionReference?: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    beneficiary?: {
      id: string;
      firstName: string;
      lastName: string;
      school?: string;
      level?: string;
      section?: string;
    } | null;
    organization?: {
      id: string;
      name: string;
    } | null;
    bundle?: {
      id: string;
      name: string;
    } | null;
    items: Array<{
      item: {
        id: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
      };
      inventoryItem: {
        id: string;
        name: string;
        sku: string;
      } | null;
    }>;
  };
}

export function PurchaseDetails({ purchase }: PurchaseDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-6 md:col-span-2">
        {/* Client Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{purchase.client.firstName} {purchase.client.lastName}</p>
                <p className="text-sm text-muted-foreground">Cliente #{purchase.client.id.substring(0, 8)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {purchase.client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{purchase.client.email}</span>
                  </div>
                )}
                
                {purchase.client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{purchase.client.phone}</span>
                  </div>
                )}
                
                {purchase.client.address && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{purchase.client.address}</span>
                  </div>
                )}
                
                {purchase.organization && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Organización: <span className="font-medium">{purchase.organization.name}</span></span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beneficiary Information - only show if there's a beneficiary */}
        {purchase.beneficiary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Beneficiario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">{purchase.beneficiary.firstName} {purchase.beneficiary.lastName}</p>
                  <p className="text-sm text-muted-foreground">Beneficiario #{purchase.beneficiary.id.substring(0, 8)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {purchase.beneficiary.school && (
                    <div className="flex items-center gap-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>{purchase.beneficiary.school}</span>
                    </div>
                  )}
                  
                  {(purchase.beneficiary.level || purchase.beneficiary.section) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {purchase.beneficiary.level} 
                        {purchase.beneficiary.section && purchase.beneficiary.level && " - "}
                        {purchase.beneficiary.section}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Items */}
        <Card>
          {/* ... existing code ... */}
        </Card>
        
        {/* ... rest of the existing code ... */}
      </div>
      
      {/* ... rest of the existing code ... */}
    </div>
  )
} 