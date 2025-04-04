"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ShoppingCart } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { getBCVRate } from "@/lib/exchangeRates"
import { getClients, getBundles, getProducts, getOrganizations } from "./actions"
import { createSale } from "./actions"
import { ClientSelect } from "./selectors/client-select"
import { BundleSelect } from "./selectors/bundle-select"
import { ProductSelect } from "./selectors/product-select"
import { BeneficiarySelect } from "./selectors/beneficiary-select"
import { OrganizationSelect } from "./selectors/organization-select"
import { SaleTypeSelector } from "./selectors/sale-type-selector"
import { Beneficiary } from "./selectors/beneficiary-select"

export default function NewSaleForm() {
  const router = useRouter()
  const methods = useForm({
    defaultValues: {
      cart: [],
      saleType: "DIRECT",
      currencyType: "USD",
      productId: "",
      bundleId: "",
    }
  })

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [bundles, setBundles] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedBundle, setSelectedBundle] = useState<any>(null)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [transactionReference, setTransactionReference] = useState("")
  const [saleType, setSaleType] = useState<"DIRECT" | "PRESALE">("DIRECT")
  const [isDraft, setIsDraft] = useState(false)
  const [isDonation, setIsDonation] = useState(false)
  const [currencyType, setCurrencyType] = useState("USD")
  const [conversionRate, setConversionRate] = useState<number>(35)
  const [bcvRate, setBcvRate] = useState<number>(35)
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [localBeneficiaries, setLocalBeneficiaries] = useState<Beneficiary[]>([])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientsRes, bundlesRes, productsRes, orgsRes] = await Promise.all([
          getClients(),
          getBundles(),
          getProducts(),
          getOrganizations()
        ])

        if (clientsRes.success) setClients(clientsRes.data || [])
        if (bundlesRes.success) setBundles(bundlesRes.data || [])
        if (productsRes.success) setProducts(productsRes.data || [])
        if (orgsRes.success) setOrganizations(orgsRes.data || [])
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedClient?.beneficiarios) {
      setLocalBeneficiaries(selectedClient.beneficiarios)
    } else {
      setLocalBeneficiaries([])
    }
  }, [selectedClient])

  useEffect(() => {
    const loadBcvRate = async () => {
      setIsLoadingRate(true)
      try {
        const rate = await getBCVRate()
        setBcvRate(rate.rate)
        setConversionRate(rate.rate)
      } catch (error) {
        console.error("Error loading BCV rate:", error)
      } finally {
        setIsLoadingRate(false)
      }
    }

    loadBcvRate()
  }, [])

  const handleClientSelect = (clientId: string, client: any) => {
    const fullClient = clients.find(c => c.id === clientId)
    if (!fullClient) return

    setSelectedClient(fullClient)
    setSelectedOrganization(organizations.find(org => org.id === fullClient.organizationId) || null)
    setSelectedBeneficiary(null)
    setSelectedBundle(null)
    setCartItems([])
  }

  const handleBundleSelect = (bundleId: string, bundle: any) => {
    setSelectedBundle(bundle)
    const newCartItems = bundle.items.map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      quantity: item.quantity,
      price: item.overridePrice ? Number(item.overridePrice) : Number(item.item.basePrice),
      originalPrice: Number(item.item.basePrice),
      currentStock: item.item.currentStock,
      allowPreSale: item.item.allowPreSale,
    }))
    setCartItems(newCartItems)

    if (bundle.currencyType) {
      setCurrencyType(bundle.currencyType)
      setConversionRate(bundle.conversionRate ? Number(bundle.conversionRate) : 35)
    }
  }

  const handleProductSelect = (productId: string, product: any) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id)
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].quantity += 1
      setCartItems(updatedItems)
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: Number(product.basePrice),
        originalPrice: Number(product.basePrice),
        currentStock: product.currentStock,
        allowPreSale: product.allowPresale || false,
      }])
    }
  }

  const handleBeneficiarySelect = (beneficiaryId: string, beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary)
  }

  const handleOrganizationSelect = (organizationId: string, organization: any) => {
    setSelectedOrganization(organization)
  }

  const handleCurrencyChange = (value: string) => {
    setCurrencyType(value)
    if (selectedBundle && selectedBundle.currencyType !== value) {
      setSelectedBundle(null)
      setCartItems([])
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const onSubmit = async () => {
    if (!selectedClient) {
      alert("Por favor selecciona un cliente")
      return
    }

    if (cartItems.length === 0) {
      alert("El carrito está vacío")
      return
    }

    setLoading(true)

    try {
      const saleData = {
        clientId: selectedClient.id,
        items: cartItems.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          overridePrice: item.price !== item.originalPrice ? item.price : undefined,
        })),
        bundleId: selectedBundle?.id,
        beneficiaryId: selectedBeneficiary?.id,
        organizationId: selectedOrganization?.id,
        paymentMethod,
        saleType,
        transactionReference: transactionReference || undefined,
        isDraft,
        isDonation,
        currencyType,
        conversionRate,
      }

      const result = await createSale(saleData)

      if (result.success) {
        router.push(`/sales/${result.data.purchase.id}`)
      } else {
        alert(result.error || "Error al crear la venta")
      }
    } catch (error) {
      console.error("Error creating sale:", error)
      alert("Error al crear la venta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <ClientSelect
                  selectedClientId={selectedClient?.id || ""}
                  onClientSelect={handleClientSelect}
                  initialClients={clients}
                />
              </div>

              {selectedClient && (
                <div className="space-y-2">
                  <Label>Beneficiario</Label>
                  <BeneficiarySelect
                    selectedBeneficiaryId={selectedBeneficiary?.id || ""}
                    onBeneficiarySelect={handleBeneficiarySelect}
                    onBeneficiaryCreated={(newBeneficiary) => {
                      setSelectedBeneficiary(newBeneficiary)
                      setLocalBeneficiaries(prev => [...prev, newBeneficiary])
                      setClients(prevClients => 
                        prevClients.map(client => 
                          client.id === selectedClient?.id 
                            ? { ...client, beneficiarios: [...(client.beneficiarios || []), newBeneficiary] }
                            : client
                        )
                      )
                    }}
                    clientId={selectedClient?.id}
                    organizationId={selectedOrganization?.id}
                    beneficiaries={localBeneficiaries}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Organización</Label>
                <OrganizationSelect
                  selectedOrganizationId={selectedOrganization?.id || ""}
                  onOrganizationSelect={handleOrganizationSelect}
                  initialOrganizations={organizations}
                />
              </div>

              <div className="space-y-2">
                <Label>Paquete (Opcional)</Label>
                <BundleSelect
                  selectedBundleId={selectedBundle?.id || ""}
                  onBundleSelect={handleBundleSelect}
                  initialBundles={bundles}
                />
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={currencyType} 
                    onValueChange={handleCurrencyChange}
                    disabled={!!selectedBundle?.currencyType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="BS">BS</SelectItem>
                    </SelectContent>
                  </Select>

                  {currencyType === "BS" && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={conversionRate}
                        onChange={(e) => setConversionRate(Number(e.target.value) || 35)}
                        disabled={!!selectedBundle?.conversionRate}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConversionRate(bcvRate)}
                        disabled={isLoadingRate || !!selectedBundle?.conversionRate}
                      >
                        {isLoadingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "BCV"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Productos Individuales</Label>
                <ProductSelect
                  selectedProductId=""
                  onProductSelect={handleProductSelect}
                  initialProducts={products}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Venta</Label>
                <SaleTypeSelector
                  onTypeChange={setSaleType}
                  defaultValue={saleType}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Borrador</Label>
                  <Switch checked={isDraft} onCheckedChange={setIsDraft} disabled={isDonation} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Donación</Label>
                  <Switch 
                    checked={isDonation} 
                    onCheckedChange={(checked) => {
                      setIsDonation(checked)
                      if (checked) setIsDraft(true)
                    }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {currencyType === "BS" && (
                  <span className="text-sm font-normal text-muted-foreground">
                    (Tasa: {conversionRate})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Precio: {currencyType === "BS" 
                          ? `${(item.price * conversionRate).toFixed(2)} Bs` 
                          : `$${item.price.toFixed(2)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = Number(e.target.value)
                          if (newQuantity > 0) {
                            const updatedItems = cartItems.map(cartItem =>
                              cartItem.id === item.id 
                                ? { ...cartItem, quantity: newQuantity }
                                : cartItem
                            )
                            setCartItems(updatedItems)
                          }
                        }}
                        className="w-20"
                        min="1"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}

                {cartItems.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    El carrito está vacío
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold">
                      {currencyType === "BS"
                        ? `${(calculateTotal() * conversionRate).toFixed(2)} Bs`
                        : `$${calculateTotal().toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Método de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="CARD">Tarjeta</SelectItem>
                        <SelectItem value="ZELLE">Zelle</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentMethod === "TRANSFER" || paymentMethod === "ZELLE" || paymentMethod === "PAYPAL") && (
                    <div>
                      <Label>Referencia</Label>
                      <Input
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="# de referencia"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !selectedClient || cartItems.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isDraft ? "Guardar como Borrador" : isDonation ? "Registrar Donación" : "Completar Venta"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </FormProvider>
  )
}