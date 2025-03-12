"use client"

import { useState } from "react"
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
import { OrganizationSelect } from "./organization-select"
import { ClientSelect } from "./client-select"
import { BeneficiarySelect, Beneficiary } from "./beneficiary-select"
import { Organization } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { CartSection } from "./cart-section"


interface InventoryItem {
  id: string
  name: string
  currentStock: number
  basePrice: string
  status: "ACTIVE" | "INACTIVE" | null
  metadata: Record<string, any> | null
  sku?: string
  description?: string | null
}

interface Bundle {
  id: string
  name: string
  description: string | null
  type: "SCHOOL_PACKAGE" | "ORGANIZATION_PACKAGE" | "REGULAR"
  basePrice: string
  status: "ACTIVE" | "INACTIVE" | null
  items: Array<{
    id: string
    quantity: number
    overridePrice?: string | null
    item: InventoryItem
  }>
}

interface CartItem {
  itemId: string
  name: string
  quantity: number
  unitPrice: number
  overridePrice?: number
  stock?: number
  allowPreSale?: boolean
}

interface OrganizationSelectFormProps {
  className?: string
  initialOrganizations: Organization[]
  initialClients: any[] // Using any for now since we don't have access to the Client type
  initialBundles: Bundle[]
  initialItems: InventoryItem[]
}

// Define form schema
const saleFormSchema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  clientId: z.string().min(1, "Please select a client"),
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  productId: z.string().optional(),
  bundleId: z.string().optional(),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
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
  const [cartTotal, setCartTotal] = useState(0)
  
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
      referenceNumber: "",
      cart: []
    },
  })

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

  const onSubmit = async (values: SaleFormValues) => {
    const formData = {
      ...values,
      total: cartTotal
    }

    console.log("Form submitted with values:", formData)
    
    try {
      // Here you would call your server action to create the sale
      // const result = await createSale(formData)
      
      toast({
        title: "Success",
        description: "Sale created successfully",
      })
      
      // Reset form
      form.reset()
      router.push("/sales")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive"
      })
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
              />

              {/* Sale Details */}
              <div className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Sale reference or PO number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              
              <Button type="submit" className="w-full">
                Create Sale
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}