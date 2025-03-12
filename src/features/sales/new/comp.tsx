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
import { ProductSelect } from "./product-select"
import { BundleSelect } from "./bundle-select"
import { formatCurrency } from "@/lib/utils"
import { Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


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
  console.log("bundles", initialBundles);
  console.log("items", initialItems);
  const { toast } = useToast()

  
  const router = useRouter()
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>("")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [selectedBundleId, setSelectedBundleId] = useState<string>("")
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  
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

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>(initialItems)
  const [availableBundles, setAvailableBundles] = useState<Bundle[]>(initialBundles)

  // Cart functions
  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find((cartItem) => cartItem.itemId === item.id)

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.itemId === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: typeof item.basePrice === "string" ? Number.parseFloat(item.basePrice) : Number(item.basePrice),
          stock: item.currentStock,
          allowPreSale: item.status === "ACTIVE",
        },
      ])
    }

    // Remove item from available items
    setAvailableItems(availableItems.filter(i => i.id !== item.id))
  }

  const removeFromCart = (itemId: string) => {
    // Get the item being removed
    const removedItem = cart.find(item => item.itemId === itemId)
    
    // Remove from cart
    setCart(cart.filter((item) => item.itemId !== itemId))

    // Add back to available items if it was a product
    if (removedItem) {
      const originalItem = initialItems.find(item => item.id === itemId)
      if (originalItem) {
        setAvailableItems([...availableItems, originalItem])
      }
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(cart.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)))
  }

  const addBundleToCart = (bundle: Bundle) => {
    // Add all bundle items to cart
    const bundleItems = bundle.items.map(item => ({
      itemId: item.item.id,
      name: item.item.name,
      quantity: item.quantity,
      unitPrice: typeof item.overridePrice === "string" ? 
        Number.parseFloat(item.overridePrice) : 
        typeof item.item.basePrice === "string" ? 
          Number.parseFloat(item.item.basePrice) : 
          Number(item.item.basePrice),
      stock: item.item.currentStock,
      allowPreSale: item.item.status === "ACTIVE",
    }))

    setCart([...cart, ...bundleItems])

    // Remove bundle items from available items
    const bundleItemIds = new Set(bundle.items.map(item => item.item.id))
    setAvailableItems(availableItems.filter(item => !bundleItemIds.has(item.id)))
    
    // Remove bundle from available bundles
    setAvailableBundles(availableBundles.filter(b => b.id !== bundle.id))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  }

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

  const handleProductSelect = (productId: string, product: InventoryItem) => {
    setSelectedProductId(productId)
    setSelectedProduct(product)
    form.setValue("productId", productId)
  }

  const handleBundleSelect = (bundleId: string, bundle: Bundle) => {
    setSelectedBundleId(bundleId)
    setSelectedBundle(bundle)
    form.setValue("bundleId", bundleId)
    addBundleToCart(bundle)
  }

  const handleCreateNewProduct = () => {
    // This will be implemented later
    console.log("Create new product")
  }

  const onSubmit = async (values: SaleFormValues) => {
    // Validate cart has items
    if (cart.length === 0) {
      form.setError("cart", {
        type: "manual",
        message: "At least one item must be added to cart"
      })
      return
    }

    // Add cart items to form data
    const formData = {
      ...values,
      cart,
      total: calculateTotal()
    }

    console.log("Form submitted with values:", formData)
    
    try {
      // Here you would call your server action to create the sale
      // const result = await createSale(formData)
      
      toast({
        title: "Success",
        description: "Sale created successfully",
      })
      
      // Reset form and cart
      form.reset()
      setCart([])
      setAvailableItems(initialItems)
      setAvailableBundles(initialBundles)
      
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

              {/* Bundle Selection */}
              <FormField
                control={form.control}
                name="bundleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundle</FormLabel>
                    <FormControl>
                      <BundleSelect
                        selectedBundleId={field.value}
                        onBundleSelect={handleBundleSelect}
                        initialBundles={initialBundles}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Selection */}
              {!selectedBundleId && (
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <ProductSelect
                          selectedProductId={field.value}
                          onProductSelect={(productId, product) => {
                            handleProductSelect(productId, product)
                            addToCart(product)
                          }}
                          initialProducts={availableItems}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Cart Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Cart <span className="text-destructive">*</span>
                  </h3>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCart([])
                        setAvailableItems(initialItems)
                        setAvailableBundles(initialBundles)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/30">
                    <p className="text-muted-foreground">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.itemId, Number.parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                disabled={item.stock !== undefined && item.quantity >= item.stock && !item.allowPreSale}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {item.quantity} x {formatCurrency(item.unitPrice)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.itemId)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center p-3 border-t pt-4">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                )}
              </div>

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