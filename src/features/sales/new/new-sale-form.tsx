"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, ShoppingCart } from "lucide-react"
import { searchClients } from "../actions"
import { searchBundlesWithCurrency, createSale } from "./actions"
import { searchInventoryItems } from "../actions"
import { CartSection } from "./cart-section"
import { Switch } from "@/components/ui/switch"
import { getBCVRate } from "@/lib/exchangeRates"

export default function NewSaleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([])
  const [bundleSearchQuery, setBundleSearchQuery] = useState("")
  const [bundleSearchResults, setBundleSearchResults] = useState<any[]>([])
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productSearchResults, setProductSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedBundle, setSelectedBundle] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [transactionReference, setTransactionReference] = useState("")
  const [saleType, setSaleType] = useState<"DIRECT" | "PRESALE">("DIRECT")
  const [isDraft, setIsDraft] = useState(false)
  const [isDonation, setIsDonation] = useState(false)
  const [currencyType, setCurrencyType] = useState("USD")
  const [conversionRate, setConversionRate] = useState<number>(35)
  const [bcvRate, setBcvRate] = useState<number>(35)
  const [isLoadingRate, setIsLoadingRate] = useState(false)

  // Beneficiary fields for bundle sales
  const [beneficiaryFields, setBeneficiaryFields] = useState({
    firstName: "",
    lastName: "",
    school: "",
    level: "",
    section: "",
  })

  // Load BCV rate on component mount
  useEffect(() => {
    const loadBcvRate = async () => {
      setIsLoadingRate(true)
      try {
        const rate = await getBCVRate()
        setBcvRate(rate)
        setConversionRate(rate)
      } catch (error) {
        console.error("Error loading BCV rate:", error)
      } finally {
        setIsLoadingRate(false)
      }
    }

    loadBcvRate()
  }, [])

  // Search for clients
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (clientSearchQuery.length >= 2) {
        setSearching(true)
        try {
          const result = await searchClients(clientSearchQuery)
          if (result.success) {
            setClientSearchResults(result.data)
          }
        } catch (error) {
          console.error("Error searching clients:", error)
        } finally {
          setSearching(false)
        }
      } else {
        setClientSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [clientSearchQuery])

  // Search for bundles
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (bundleSearchQuery.length >= 2) {
        setSearching(true)
        try {
          // Search bundles with currency filter
          const result = await searchBundlesWithCurrency(bundleSearchQuery, currencyType)
          if (result.success) {
            setBundleSearchResults(result.data)
          }
        } catch (error) {
          console.error("Error searching bundles:", error)
        } finally {
          setSearching(false)
        }
      } else {
        setBundleSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [bundleSearchQuery, currencyType])

  // Search for products
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (productSearchQuery.length >= 2) {
        setSearching(true)
        try {
          const result = await searchInventoryItems(productSearchQuery)
          if (result.success) {
            setProductSearchResults(result.data)
          }
        } catch (error) {
          console.error("Error searching products:", error)
        } finally {
          setSearching(false)
        }
      } else {
        setProductSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [productSearchQuery])

  // When currency changes, refresh bundle search
  useEffect(() => {
    if (bundleSearchQuery.length >= 2) {
      const searchBundles = async () => {
        setSearching(true)
        try {
          const result = await searchBundlesWithCurrency(bundleSearchQuery, currencyType)
          if (result.success) {
            setBundleSearchResults(result.data)
          }
        } catch (error) {
          console.error("Error searching bundles:", error)
        } finally {
          setSearching(false)
        }
      }

      searchBundles()
    }

    // Clear selected bundle if currency changes
    if (selectedBundle && selectedBundle.currencyType !== currencyType) {
      setSelectedBundle(null)
      setCartItems([])
    }
  }, [currencyType])

  // Select a client
  const selectClient = (client: any) => {
    setSelectedClient(client)
    setClientSearchQuery("")
    setClientSearchResults([])
  }

  // Select a bundle
  const selectBundle = (bundle: any) => {
    setSelectedBundle(bundle)
    setBundleSearchQuery("")
    setBundleSearchResults([])

    // Add bundle items to cart
    const newCartItems = bundle.items.map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      quantity: item.quantity,
      price: item.overridePrice ? Number.parseFloat(item.overridePrice) : Number.parseFloat(item.item.basePrice),
      originalPrice: Number.parseFloat(item.item.basePrice),
      currentStock: item.item.currentStock,
      allowPreSale: item.item.allowPreSale,
    }))

    setCartItems(newCartItems)

    // If bundle has a specific currency, use it
    if (bundle.currencyType) {
      setCurrencyType(bundle.currencyType)

      // If bundle has a conversion rate, use it
      if (bundle.conversionRate) {
        setConversionRate(Number.parseFloat(bundle.conversionRate))
      }
    }
  }

  // Add a product to cart
  const addProductToCart = (product: any) => {
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id)

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].quantity += 1
      setCartItems(updatedItems)
    } else {
      // Add new item to cart
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          price: Number.parseFloat(product.basePrice),
          originalPrice: Number.parseFloat(product.basePrice),
          currentStock: product.currentStock,
          allowPreSale: product.allowPresale || false,
        },
      ])
    }

    setProductSearchQuery("")
    setProductSearchResults([])
  }

  // Update cart item
  const updateCartItem = (id: string, quantity: number, price?: number) => {
    const updatedItems = cartItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          price: price !== undefined ? price : item.price,
        }
      }
      return item
    })
    setCartItems(updatedItems)
  }

  // Remove cart item
  const removeCartItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setCurrencyType(value)

    // Reset bundle if currency changes
    if (selectedBundle && selectedBundle.currencyType && selectedBundle.currencyType !== value) {
      setSelectedBundle(null)
      setCartItems([])
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        items: cartItems.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
          overridePrice: item.price !== item.originalPrice ? item.price : undefined,
        })),
        bundleId: selectedBundle?.id,
        paymentMethod,
        saleType,
        transactionReference: transactionReference || undefined,
        organizationId: selectedClient.organizationId || undefined,
        isDraft,
        isDonation,
        currencyType,
        conversionRate,
      }

      // Add beneficiary data if this is a bundle sale and fields are filled
      if (selectedBundle && beneficiaryFields.firstName && beneficiaryFields.lastName) {
        saleData.beneficiary = beneficiaryFields
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

  // Handle donation toggle
  const handleDonationToggle = (checked: boolean) => {
    setIsDonation(checked)
    // If marking as donation, also mark as draft
    if (checked) {
      setIsDraft(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searching && clientSearchQuery.length >= 2 && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {clientSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {clientSearchResults.map((client) => (
                    <div
                      key={client.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => selectClient(client)}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.document && `Doc: ${client.document}`}
                        {client.phone && ` | Tel: ${client.phone}`}
                      </div>
                      {client.organization && (
                        <div className="text-sm text-blue-600">Org: {client.organization.name}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="font-medium">{selectedClient.name}</div>
                <div className="text-sm">
                  {selectedClient.document && `Doc: ${selectedClient.document}`}
                  {selectedClient.phone && ` | Tel: ${selectedClient.phone}`}
                </div>
                {selectedClient.organization && (
                  <div className="text-sm text-blue-600 mt-1">Organización: {selectedClient.organization.name}</div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => setSelectedClient(null)}
                >
                  Cambiar cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bundle Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Paquete (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  placeholder="Buscar paquete..."
                  value={bundleSearchQuery}
                  onChange={(e) => setBundleSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!selectedClient}
                />
              </div>
              {searching && bundleSearchQuery.length >= 2 && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {bundleSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {bundleSearchResults.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => selectBundle(bundle)}
                    >
                      <div className="font-medium">{bundle.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Precio:{" "}
                        {bundle.currencyType === "BS"
                          ? `${Number.parseFloat(bundle.basePrice).toFixed(2)} Bs`
                          : `$${Number.parseFloat(bundle.basePrice).toFixed(2)}`}
                        {bundle.currencyType === "BS" && " (Bolívares)"}
                      </div>
                      <div className="text-sm text-muted-foreground">{bundle.items.length} productos</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedBundle && (
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="font-medium">{selectedBundle.name}</div>
                <div className="text-sm text-muted-foreground">
                  Precio:{" "}
                  {selectedBundle.currencyType === "BS"
                    ? `${Number.parseFloat(selectedBundle.basePrice).toFixed(2)} Bs`
                    : `$${Number.parseFloat(selectedBundle.basePrice).toFixed(2)}`}
                  {selectedBundle.currencyType === "BS" && " (Bolívares)"}
                </div>
                <div className="text-sm text-muted-foreground">{selectedBundle.items.length} productos</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => {
                    setSelectedBundle(null)
                    setCartItems([])
                  }}
                >
                  Cambiar paquete
                </Button>
              </div>
            )}

            {/* Beneficiary Fields for Bundle Sales */}
            {selectedBundle && (
              <div className="border rounded-md p-3 mt-4">
                <h4 className="font-medium mb-2">Datos del Beneficiario</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName" className="text-xs">
                        Nombre
                      </Label>
                      <Input
                        id="firstName"
                        value={beneficiaryFields.firstName}
                        onChange={(e) => setBeneficiaryFields({ ...beneficiaryFields, firstName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs">
                        Apellido
                      </Label>
                      <Input
                        id="lastName"
                        value={beneficiaryFields.lastName}
                        onChange={(e) => setBeneficiaryFields({ ...beneficiaryFields, lastName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="school" className="text-xs">
                      Escuela
                    </Label>
                    <Input
                      id="school"
                      value={beneficiaryFields.school}
                      onChange={(e) => setBeneficiaryFields({ ...beneficiaryFields, school: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="level" className="text-xs">
                        Grado/Año
                      </Label>
                      <Input
                        id="level"
                        value={beneficiaryFields.level}
                        onChange={(e) => setBeneficiaryFields({ ...beneficiaryFields, level: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section" className="text-xs">
                        Sección
                      </Label>
                      <Input
                        id="section"
                        value={beneficiaryFields.section}
                        onChange={(e) => setBeneficiaryFields({ ...beneficiaryFields, section: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Productos Individuales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  placeholder="Buscar producto..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!selectedClient}
                />
              </div>
              {searching && productSearchQuery.length >= 2 && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {productSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {productSearchResults.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => addProductToCart(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku} | Stock: {product.currentStock} | Precio: $
                        {Number.parseFloat(product.basePrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Selection */}
            <div className="border rounded-md p-3 bg-muted/30">
              <h4 className="font-medium mb-2">Moneda</h4>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={currencyType}
                  onValueChange={handleCurrencyChange}
                  disabled={!!selectedBundle && !!selectedBundle.currencyType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="BS">Bolívares (BS)</SelectItem>
                  </SelectContent>
                </Select>

                {currencyType === "BS" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(Number.parseFloat(e.target.value) || 35)}
                      placeholder="Tasa de cambio"
                      disabled={!!selectedBundle && !!selectedBundle.conversionRate}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => setConversionRate(bcvRate)}
                      disabled={isLoadingRate || (!!selectedBundle && !!selectedBundle.conversionRate)}
                    >
                      {isLoadingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "BCV"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sale Options */}
            <div className="border rounded-md p-3">
              <h4 className="font-medium mb-2">Opciones de Venta</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="saleType" className="text-sm">
                    Tipo de Venta
                  </Label>
                  <Select value={saleType} onValueChange={(value) => setSaleType(value as "DIRECT" | "PRESALE")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIRECT">Venta Directa</SelectItem>
                      <SelectItem value="PRESALE">Pre-Venta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isDraft" className="text-sm">
                    Guardar como Borrador
                  </Label>
                  <Switch
                    id="isDraft"
                    checked={isDraft}
                    onCheckedChange={setIsDraft}
                    disabled={isDonation} // Disabled if it's a donation
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isDonation" className="text-sm">
                    Marcar como Donación
                  </Label>
                  <Switch id="isDonation" checked={isDonation} onCheckedChange={handleDonationToggle} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrito
            {currencyType === "BS" && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Bolívares - Tasa: {conversionRate})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CartSection
            items={cartItems}
            updateItem={updateCartItem}
            removeItem={removeCartItem}
            currencyType={currencyType}
            conversionRate={conversionRate}
          />
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <div className="w-full flex justify-between items-center">
            <div className="space-y-1">
              <Label htmlFor="paymentMethod">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Método de pago" />
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
              <div className="space-y-1">
                <Label htmlFor="transactionReference">Referencia</Label>
                <Input
                  id="transactionReference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="# de referencia"
                  className="w-[200px]"
                />
              </div>
            )}

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total:</div>
              <div className="text-2xl font-bold">
                {currencyType === "USD"
                  ? `$${calculateTotal().toFixed(2)}`
                  : `${(calculateTotal() * conversionRate).toFixed(2)} Bs`}
              </div>
            </div>
          </div>

          <div className="w-full flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={loading || !selectedClient || cartItems.length === 0}
              className="w-full md:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDraft ? "Guardar como Borrador" : isDonation ? "Registrar Donación" : "Completar Venta"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}

