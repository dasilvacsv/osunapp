"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input" 
import { Textarea } from "@/components/ui/textarea"
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OrganizationSelect } from "./selectors/organization-select"
import { ClientSelect } from "./selectors/client-select"
import { BeneficiarySelect, Beneficiary } from "./selectors/beneficiary-select"
import { Organization } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { CartSection } from "./cart-section"
import { type Bundle, type CartItem, type InventoryItem } from "./types"
import { type Client } from "./selectors/client-select"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { CreditCard, Loader2 } from "lucide-react"
import { createSale } from "./products"

export interface OrganizationSelectFormProps {
  className?: string;
  initialOrganizations: Organization[];
  initialClients: Client[];
  initialBundles: Bundle[];
  initialItems: InventoryItem[];
  onSubmit: (data: {
    organizationId: string;
    clientId: string;
    beneficiarioId: string;
    bundleId?: string;
    cart: CartItem[];
    totalAmount: number;
  }) => Promise<void>;
}

// Define form schema
const saleFormSchema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  clientId: z.string().min(1, "Please select a client"),
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  productId: z.string().optional(),
  bundleId: z.string().optional(),
  notes: z.string().optional(),
  saleType: z.enum(["DIRECT", "PRESALE"]).default("DIRECT"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]).default("CASH"),
  transactionReference: z.string().optional(),
  cart: z.array(z.object({
    itemId: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    overridePrice: z.number().optional(),
    stock: z.number().optional(),
    allowPreSale: z.boolean().optional()
  })).min(1, "At least one item must be added to cart")
})

type SaleFormValues = z.infer<typeof saleFormSchema>

export function OrganizationSelectForm({ 
  className,
  initialOrganizations, 
  initialClients,
  initialBundles,
  initialItems 
}: OrganizationSelectFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>("")
  const [selectedBundleId, setSelectedBundleId] = useState<string>("")
  const [cartTotal, setCartTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Initialize form
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      organizationId: "",
      clientId: "",
      beneficiaryId: "",
      productId: "",
      bundleId: "",
      notes: "",
      saleType: "DIRECT",
      paymentMethod: "CASH",
      transactionReference: "",
      cart: []
    },
  })

  // Watch the saleType field to conditionally render payment fields
  const saleType = form.watch("saleType")

  const handleOrganizationSelect = (organizationId: string, organization: Organization) => {
    setSelectedOrganizationId(organizationId)
    form.setValue("organizationId", organizationId)
  }

  const handleClientSelect = (clientId: string, client: any) => {
    setSelectedClientId(clientId)
    setSelectedClient(client)
    form.setValue("clientId", clientId)
    // Reset beneficiary when client changes
    setSelectedBeneficiaryId("")
    form.setValue("beneficiaryId", "")
    
    // If client has an organization, auto-select it
    if (client.organizationId) {
      const clientOrg = initialOrganizations.find(org => org.id === client.organizationId)
      if (clientOrg) {
        handleOrganizationSelect(clientOrg.id, clientOrg)
      }
    } else {
      // Reset organization if client has none
      setSelectedOrganizationId("")
      form.setValue("organizationId", "")
    }
  }

  const handleBeneficiarySelect = (beneficiaryId: string, beneficiary: Beneficiary) => {
    setSelectedBeneficiaryId(beneficiaryId)
    form.setValue("beneficiaryId", beneficiaryId)
  }

  const handleCartChange = (newCart: CartItem[]) => {
    form.setValue("cart", newCart)
  }

  const handleBundleSelect = async (bundleId: string, bundle: Bundle) => {
    // Clear previous cart items
    handleCartChange([])
    setCartTotal(0)
    
    // Set the selected bundle ID
    setSelectedBundleId(bundleId)
    form.setValue("bundleId", bundleId)
    
    // Check inventory status for all items
    const status: Record<string, boolean> = {}
    for (const item of bundle.items) {
      status[item.item.id] = item.item.currentStock >= item.quantity
    }
    
    // Calculate prices with discounts
    const cartItems = bundle.items.map(item => ({
      itemId: item.item.id,
      name: item.item.name,
      quantity: item.quantity,
      unitPrice: calculateBundleItemPrice(item, bundle.discountPercentage || 0),
      stock: item.item.currentStock,
      allowPreSale: item.item.status === "ACTIVE",
      isFromBundle: true,
      bundleId: bundle.id
    }))

    // Update the cart with the bundle items
    handleCartChange(cartItems)
    setCartTotal(calculateTotal(cartItems))
  }

  const calculateBundleItemPrice = (item: any, bundleDiscount: number = 0) => {
    const basePrice = item.overridePrice || item.item.basePrice
    return Number(basePrice) * (1 - (bundleDiscount / 100))
  }

  const calculateTotal = (cartItems: CartItem[]): number => {
    return cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  }

  const handleSaleTypeChange = (type: "DIRECT" | "PRESALE") => {
    form.setValue("saleType", type)
  }

  const onSubmit = async (values: SaleFormValues) => {
    try {
      setLoading(true)
      
      const formData = {
        ...values,
        total: cartTotal
      }

      console.log("Form submitted with values:", formData)
      
      // Call the server action to create the sale
      const result = await createSale(formData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Sale created successfully${result.data?.id ? ` with ID: ${result.data.id}` : ''}`,
        })
        
        // Reset form
        form.reset()
        router.push("/sales")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create sale",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Sale</CardTitle>
          <CardDescription>Select a client and organization for this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <ClientSelect
                        selectedClientId={field.value}
                        onClientSelect={handleClientSelect}
                        initialClients={initialClients}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Selection */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <OrganizationSelect
                        selectedOrganizationId={field.value}
                        onOrganizationSelect={handleOrganizationSelect}
                        initialOrganizations={initialOrganizations}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Beneficiary Selection */}
              <FormField
                control={form.control}
                name="beneficiaryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary</FormLabel>
                    <FormControl>
                      <BeneficiarySelect
                        selectedBeneficiaryId={field.value}
                        onBeneficiarySelect={handleBeneficiarySelect}
                        clientId={selectedClientId}
                        organizationId={selectedOrganizationId}
                        beneficiaries={selectedClient?.beneficiarios || []}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cart Section */}
              <CartSection 
                control={form.control}
                initialItems={initialItems}
                initialBundles={initialBundles}
                onCartChange={handleCartChange}
                onTotalChange={setCartTotal}
                onSaleTypeChange={handleSaleTypeChange}
                selectedBundleId={selectedBundleId}
                onBundleSelect={handleBundleSelect}
              />

              {/* Sale Details */}
              <div className="space-y-4 pt-4">
                {/* Payment Method - Only show for DIRECT sales */}
                {saleType === "DIRECT" && (
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Method
                        </FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">Cash</SelectItem>
                              <SelectItem value="CARD">Card</SelectItem>
                              <SelectItem value="TRANSFER">Transfer</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Transaction Reference - Only show for DIRECT sales */}
                {saleType === "DIRECT" && (
                  <FormField
                    control={form.control}
                    name="transactionReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Reference</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Receipt number, transaction ID, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes for this sale" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Sale...
                  </>
                ) : (
                  "Create Sale"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}