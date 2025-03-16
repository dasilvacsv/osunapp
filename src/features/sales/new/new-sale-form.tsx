"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ClientSelect, type Client } from "@/features/sales/new/selectors/client-select"
import { OrganizationSelect, type Organization } from "@/features/sales/new/selectors/organization-select"
import { BeneficiarySelect, type Beneficiary } from "@/features/sales/new/selectors/beneficiary-select"
import { BundleSelect, type Bundle } from "@/features/sales/new/selectors/bundle-select"
import { ProductSelect, type InventoryItem } from "@/features/sales/new/selectors/product-select"
import { SaleTypeSelector } from "@/features/sales/new/selectors/sale-type-selector"
import { createSale, getBeneficiariesByClient } from "@/features/sales/new/actions"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ShoppingCart, User, Package2, CreditCard, Trash2, Save, Loader2, FileText, Coins } from "lucide-react"

// Form schema
const saleFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  organizationId: z.string().optional(),
  beneficiaryId: z.string().optional(),
  saleType: z.enum(["DIRECT", "PRESALE"]),
  bundleId: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price must be positive"),
        totalPrice: z.number().min(0, "Total must be positive"),
      }),
    )
    .optional(),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  vendido: z.boolean().default(false),
  currencyType: z.enum(["USD", "BS"]).default("USD"),
  conversionRate: z.number().min(0.01, "Conversion rate must be positive").default(1),
})

type SaleFormValues = z.infer<typeof saleFormSchema>

interface NewSaleFormProps {
  initialClients: Client[]
  initialOrganizations: Organization[]
  initialProducts: InventoryItem[]
  initialBundles: Bundle[]
}

export function NewSaleForm({
  initialClients,
  initialOrganizations,
  initialProducts,
  initialBundles,
}: NewSaleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [saleItems, setSaleItems] = useState<
    {
      itemId: string
      item: InventoryItem
      quantity: number
      unitPrice: number
      totalPrice: number
    }[]
  >([])

  // Initialize form
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      clientId: "",
      organizationId: "",
      beneficiaryId: "",
      saleType: "DIRECT",
      bundleId: "",
      items: [],
      totalAmount: 0,
      paymentMethod: "CASH",
      transactionReference: "",
      notes: "",
      isPaid: false,
      isDraft: false,
      vendido: false,
      currencyType: "USD",
      conversionRate: 1,
    },
  })

  // Watch form values
  const saleType = form.watch("saleType")
  const isPaid = form.watch("isPaid")
  const currencyType = form.watch("currencyType")
  const conversionRate = form.watch("conversionRate")

  // Load beneficiaries when client changes
  useEffect(() => {
    if (selectedClient?.id) {
      const loadBeneficiaries = async () => {
        try {
          const result = await getBeneficiariesByClient(selectedClient.id)
          if (result.success && result.data) {
            setBeneficiaries(result.data)
          }
        } catch (error) {
          console.error("Failed to load beneficiaries:", error)
        }
      }

      loadBeneficiaries()
    } else {
      setBeneficiaries([])
    }
  }, [selectedClient])

  // Update total amount when items change
  useEffect(() => {
    const total = saleItems.reduce((sum, item) => sum + item.totalPrice, 0)
    form.setValue("totalAmount", total)
    form.setValue(
      "items",
      saleItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    )
  }, [saleItems, form])

  // Handle client selection
  const handleClientSelect = (clientId: string, client: Client) => {
    setSelectedClient(client)
    form.setValue("clientId", clientId)

    // If client has an organization, select it
    if (client.organizationId) {
      form.setValue("organizationId", client.organizationId)
      const org = initialOrganizations.find((o) => o.id === client.organizationId)
      if (org) {
        setSelectedOrganization(org)
      }
    }

    // Reset beneficiary if client changes
    form.setValue("beneficiaryId", "")
    setSelectedBeneficiary(null)
  }

  // Handle organization selection
  const handleOrganizationSelect = (organizationId: string, organization: Organization) => {
    setSelectedOrganization(organization)
    form.setValue("organizationId", organizationId)
  }

  // Handle beneficiary selection
  const handleBeneficiarySelect = (beneficiaryId: string, beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary)
    form.setValue("beneficiaryId", beneficiaryId)
  }

  // Handle beneficiary creation
  const handleBeneficiaryCreated = (beneficiary: Beneficiary) => {
    setBeneficiaries((prev) => [...prev, beneficiary])
    setSelectedBeneficiary(beneficiary)
    form.setValue("beneficiaryId", beneficiary.id)
  }

  // Handle bundle selection
  const handleBundleSelect = (bundleId: string, bundle: Bundle) => {
    setSelectedBundle(bundle)
    form.setValue("bundleId", bundleId)

    // Add bundle items to sale items
    if (bundle.items && bundle.items.length > 0) {
      const bundleItems = bundle.items.map((bundleItem) => ({
        itemId: bundleItem.item.id,
        item: bundleItem.item,
        quantity: bundleItem.quantity,
        unitPrice: Number(bundleItem.overridePrice || bundleItem.item.basePrice),
        totalPrice: Number(bundleItem.overridePrice || bundleItem.item.basePrice) * bundleItem.quantity,
      }))

      setSaleItems(bundleItems)
    }
  }

  // Handle product selection
  const handleProductSelect = (productId: string, product: InventoryItem) => {
    // Check if product already exists in items
    const existingItemIndex = saleItems.findIndex((item) => item.itemId === productId)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems]
      updatedItems[existingItemIndex].quantity += 1
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].unitPrice * updatedItems[existingItemIndex].quantity

      setSaleItems(updatedItems)
    } else {
      // Add new item
      setSaleItems([
        ...saleItems,
        {
          itemId: productId,
          item: product,
          quantity: 1,
          unitPrice: Number(product.basePrice),
          totalPrice: Number(product.basePrice),
        },
      ])
    }
  }

  // Handle item quantity change
  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...saleItems]
    updatedItems[index].quantity = quantity
    updatedItems[index].totalPrice = updatedItems[index].unitPrice * quantity

    setSaleItems(updatedItems)
  }

  // Handle item price change
  const handleItemPriceChange = (index: number, price: number) => {
    const updatedItems = [...saleItems]
    updatedItems[index].unitPrice = price
    updatedItems[index].totalPrice = price * updatedItems[index].quantity

    setSaleItems(updatedItems)
  }

  // Handle item removal
  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  // Handle form submission
  const onSubmit = async (values: SaleFormValues) => {
    if (saleItems.length === 0 && !values.bundleId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one product or select a bundle",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createSale({
        ...values,
        items: saleItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        paymentMetadata: {
          saleType: values.saleType,
          notes: values.notes,
        },
      })

      if (result.success && result.data) {
        toast({
          title: "Sale created",
          description: `Sale #${result.data.id.slice(0, 8)} has been created successfully`,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })

        // Redirect to sale details page
        router.push(`/sales/${result.data.id}`)
      } else {
        throw new Error(result.error || "Failed to create sale")
      }
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Información de Venta
            </CardTitle>
            <CardDescription>Selecciona el tipo de venta y los detalles básicos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="saleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Venta</FormLabel>
                  <FormControl>
                    <SaleTypeSelector onTypeChange={(type) => field.onChange(type)} defaultValue={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="isDraft"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Borrador</FormLabel>
                      <FormDescription>Marcar como borrador pendiente de aprobación</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendido"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Vendido</FormLabel>
                      <FormDescription>Marcar esta venta como vendida</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente y Beneficiario
            </CardTitle>
            <CardDescription>Selecciona el cliente y el beneficiario de la venta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
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

            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organización (opcional)</FormLabel>
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

            <FormField
              control={form.control}
              name="beneficiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiario (opcional)</FormLabel>
                  <FormControl>
                    <BeneficiarySelect
                      selectedBeneficiaryId={field.value}
                      onBeneficiarySelect={handleBeneficiarySelect}
                      onBeneficiaryCreated={handleBeneficiaryCreated}
                      clientId={form.getValues("clientId")}
                      organizationId={form.getValues("organizationId")}
                      beneficiaries={beneficiaries}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Productos
            </CardTitle>
            <CardDescription>Selecciona los productos o un paquete para la venta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="bundleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paquete (opcional)</FormLabel>
                  <FormControl>
                    <BundleSelect
                      selectedBundleId={field.value}
                      onBundleSelect={handleBundleSelect}
                      initialBundles={initialBundles}
                    />
                  </FormControl>
                  <FormDescription>Seleccionar un paquete agregará automáticamente sus productos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Productos Individuales</FormLabel>
                <ProductSelect
                  selectedProductId=""
                  onProductSelect={(id, product) => handleProductSelect(id, product)}
                  initialProducts={initialProducts}
                />
              </div>

              {saleItems.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Producto</th>
                        <th className="text-center p-3 text-sm font-medium">Cantidad</th>
                        <th className="text-center p-3 text-sm font-medium">Precio</th>
                        <th className="text-right p-3 text-sm font-medium">Total</th>
                        <th className="p-3 text-sm font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => (
                        <tr key={`${item.itemId}-${index}`} className="border-t">
                          <td className="p-3 text-sm">
                            <div className="font-medium">{item.item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.item.sku}</div>
                          </td>
                          <td className="p-3 text-sm text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(index, Number.parseInt(e.target.value) || 1)}
                              className="w-20 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3 text-sm text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemPriceChange(index, Number.parseFloat(e.target.value) || 0)}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          <td className="p-3 text-sm">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr>
                        <td colSpan={3} className="p-3 text-sm font-medium text-right">
                          Total:
                        </td>
                        <td className="p-3 text-sm text-right font-bold">
                          {formatCurrency(form.getValues("totalAmount"))} {currencyType}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center text-muted-foreground">
                  <Package2 className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay productos seleccionados</p>
                  <p className="text-sm mt-1">Selecciona un paquete o agrega productos individuales</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pago
            </CardTitle>
            <CardDescription>Configura los detalles del pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currencyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BS">BS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currencyType === "BS" && (
                <FormField
                  control={form.control}
                  name="conversionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa de cambio</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Tasa BS/USD"
                            className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Tasa de cambio BS/USD (cuántos BS equivalen a 1 USD)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de transacción (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Número de referencia, recibo, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Pagado</FormLabel>
                    <FormDescription>Marcar esta venta como pagada</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Información adicional sobre la venta" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/sales")} disabled={isSubmitting}>
              Cancelar
            </Button>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="outline"
                onClick={() => {
                  form.setValue("isDraft", true)
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Guardar como borrador
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Crear venta
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

