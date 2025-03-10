"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShoppingCart, Package, Search, Plus, Trash, CreditCard, User, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSelector } from "./client-selector"
import { SaleTypeSelector } from "./sale-type-selector"
import { OrganizationSelector } from "./organization-selector"
import { createPurchase, searchBundles, searchInventoryItems } from "./actions"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"

interface NewSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newSale: any) => void
}

interface InventoryItem {
  id: string
  name: string
  basePrice: string | number
  currentStock: number
  sku?: string
  allowPreSale?: boolean
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

interface Bundle {
  id: string
  name: string
  basePrice: string | number
  type: string
  items: Array<{
    id: string
    quantity: number
    overridePrice?: string | number
    item: InventoryItem
  }>
}

export function NewSaleDialog({ open, onOpenChange, onSuccess }: NewSaleDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([])
  const [bundleResults, setbundleResults] = useState<Bundle[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [saleType, setSaleType] = useState<"DIRECT" | "PRESALE">("DIRECT")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const [transactionReference, setTransactionReference] = useState("")

  // Beneficiary fields for bundle sales
  const [beneficiaryFirstName, setBeneficiaryFirstName] = useState("")
  const [beneficiaryLastName, setBeneficiaryLastName] = useState("")
  const [beneficiarySchool, setBeneficiarySchool] = useState("")
  const [beneficiaryLevel, setBeneficiaryLevel] = useState("")
  const [beneficiarySection, setBeneficiarySection] = useState("")

  // Validation states
  const [clientError, setClientError] = useState(false)
  const [cartError, setCartError] = useState(false)
  const [beneficiaryError, setBeneficiaryError] = useState(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchProducts()
      }, 300)

      return () => clearTimeout(delaySearch)
    } else {
      setSearchResults([])
      setbundleResults([])
    }
  }, [searchQuery])

  const searchProducts = async () => {
    if (searchQuery.length < 2) return

    setSearchLoading(true)
    try {
      // Buscar productos individuales
      const itemsResult = await searchInventoryItems(searchQuery)
      if (itemsResult.success) {
        setSearchResults(itemsResult.data || [])
      } else {
        setSearchResults([])
      }

      // Buscar paquetes
      const bundleResult = await searchBundles(searchQuery)
      if (bundleResult.success) {
        if (bundleResult.data) {
          // Asegurarse de que los datos de bundle tengan el formato correcto
          const formattedBundles = bundleResult.data.map((bundle: any) => {
            // Asegurarse de que items sea un array
            const items = Array.isArray(bundle.items) ? bundle.items : []
            return {
              ...bundle,
              items: items.filter((item: any) => item && item.item), // Filtrar items inválidos
            }
          })
          setbundleResults(formattedBundles)
        } else {
          setbundleResults([])
        }
      }
    } catch (error) {
      console.error("Error searching products:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados de búsqueda",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

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
          unitPrice: typeof item.basePrice === "string" ? Number.parseFloat(item.basePrice) : item.basePrice,
          stock: item.currentStock,
          allowPreSale: item.allowPreSale,
        },
      ])
    }

    // Clear cart error if it was set
    if (cartError) setCartError(false)
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.itemId !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(cart.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)))
  }

  const selectBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle)

    // Verificar que bundle.items sea un array válido
    if (!Array.isArray(bundle.items) || bundle.items.length === 0) {
      setCart([])
      console.warn("El bundle no tiene items o no es un array válido", bundle)
      return
    }

    // Convertir los items del paquete al formato del carrito
    const cartItems: CartItem[] = bundle.items
      .filter((item) => item && item.item) // Filtrar items inválidos
      .map((item) => ({
        itemId: item.item.id,
        name: item.item.name,
        quantity: item.quantity,
        unitPrice:
          typeof item.overridePrice === "string"
            ? Number.parseFloat(item.overridePrice)
            : item.overridePrice ||
              (typeof item.item.basePrice === "string" ? Number.parseFloat(item.item.basePrice) : item.item.basePrice),
        overridePrice: item.overridePrice
          ? typeof item.overridePrice === "string"
            ? Number.parseFloat(item.overridePrice)
            : item.overridePrice
          : undefined,
        stock: item.item.currentStock,
        allowPreSale: item.item.allowPreSale,
      }))

    setCart(cartItems)

    // Clear cart error if it was set
    if (cartError) setCartError(false)
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  }

  const handleCreateClient = () => {
    // Aquí deberías implementar la lógica para crear un nuevo cliente
    // Por ahora, simplemente mostraremos un mensaje
    toast({
      title: "Crear cliente",
      description: "Esta funcionalidad aún no está implementada",
    })
  }

  const validateForm = () => {
    let isValid = true

    // Validar cliente
    if (!selectedClient) {
      setClientError(true)
      isValid = false
    } else {
      setClientError(false)
    }

    // Validar carrito
    if (cart.length === 0) {
      setCartError(true)
      isValid = false
    } else {
      setCartError(false)
    }

    // Validar beneficiario si es una venta de paquete
    if (
      selectedBundle &&
      (!beneficiaryFirstName || !beneficiaryLastName || !beneficiarySchool || !beneficiaryLevel || !beneficiarySection)
    ) {
      setBeneficiaryError(true)
      isValid = false
    } else {
      setBeneficiaryError(false)
    }

    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const purchaseData: any = {
        clientId: selectedClient.id,
        items: cart.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          overridePrice: item.overridePrice,
        })),
        paymentMethod,
        saleType,
        organizationId: selectedOrganizationId === "none" ? null : selectedOrganizationId,
      }

      // Agregar referencia de transacción si existe
      if (transactionReference) {
        purchaseData.transactionReference = transactionReference
      }

      // Agregar datos del paquete y beneficiario si es necesario
      if (selectedBundle) {
        purchaseData.bundleId = selectedBundle.id
        purchaseData.beneficiary = {
          firstName: beneficiaryFirstName,
          lastName: beneficiaryLastName,
          school: beneficiarySchool,
          level: beneficiaryLevel,
          section: beneficiarySection,
        }
      }

      const result = await createPurchase(purchaseData)

      if (result.success) {
        toast({
          title: "Venta creada",
          description: `La venta se ha registrado correctamente`,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })

        // Llamar al callback de éxito si existe
        if (onSuccess && result.data) {
          onSuccess(result.data)
        }

        onOpenChange(false)

        // Redirigir a la página de detalles de la venta
        if (result.data?.id) {
          router.push(`/sales/${result.data.id}`)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la venta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCart([])
    setSelectedClient(null)
    setSelectedBundle(null)
    setSaleType("DIRECT")
    setPaymentMethod("CASH")
    setSelectedOrganizationId(null)
    setTransactionReference("")
    setBeneficiaryFirstName("")
    setBeneficiaryLastName("")
    setBeneficiarySchool("")
    setBeneficiaryLevel("")
    setBeneficiarySection("")
    setSearchQuery("")
    setClientError(false)
    setCartError(false)
    setBeneficiaryError(false)
  }

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Nueva Venta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de venta */}
          <div className="space-y-2">
            <SaleTypeSelector onTypeChange={setSaleType} defaultValue={saleType} />
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente <span className="text-destructive">*</span>
            </Label>
            <ClientSelector
              onClientSelect={(client) => {
                setSelectedClient(client)
                setClientError(false)

                // Si el cliente tiene una organización, seleccionarla automáticamente
                if (client?.organizationId) {
                  setSelectedOrganizationId(client.organizationId)
                }
              }}
              selectedClient={selectedClient}
              onCreateClient={handleCreateClient}
            />
            {clientError && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Debes seleccionar un cliente
              </p>
            )}
          </div>

          {/* Organización */}
          <OrganizationSelector
            onOrganizationSelect={setSelectedOrganizationId}
            selectedOrganizationId={selectedOrganizationId}
          />

          {/* Búsqueda de productos */}
          <div className="space-y-2">
            <Label htmlFor="productSearch">Buscar productos o paquetes</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="productSearch"
                placeholder="Nombre del producto o paquete..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {searchLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="products">Productos</TabsTrigger>
                <TabsTrigger value="bundles">Paquetes</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="pt-4">
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                    <AnimatePresence>
                      {searchResults.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            flex justify-between items-center p-3 border rounded-md 
                            hover:bg-muted/50 cursor-pointer transition-colors
                            ${item.currentStock <= 0 && !item.allowPreSale ? "opacity-50 bg-muted" : ""}
                          `}
                          onClick={() => (item.currentStock > 0 || item.allowPreSale) && addToCart(item)}
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">Stock: {item.currentStock}</p>
                              {item.currentStock <= 0 && !item.allowPreSale && (
                                <Badge variant="destructive" className="text-xs">
                                  Sin stock
                                </Badge>
                              )}
                              {item.currentStock <= 0 && item.allowPreSale && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                >
                                  Pre-venta
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(
                                typeof item.basePrice === "string" ? Number.parseFloat(item.basePrice) : item.basePrice,
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={item.currentStock <= 0 && !item.allowPreSale}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <p className="text-center py-4 text-muted-foreground">No se encontraron productos</p>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Ingresa al menos 2 caracteres para buscar</p>
                )}
              </TabsContent>
              <TabsContent value="bundles" className="pt-4">
                {bundleResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1">
                    <AnimatePresence>
                      {bundleResults.map((bundle, index) => (
                        <motion.div
                          key={bundle.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => selectBundle(bundle)}
                        >
                          <div>
                            <p className="font-medium">{bundle.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {Array.isArray(bundle.items) ? bundle.items.length : 0} productos
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {bundle.type === "SCHOOL_PACKAGE"
                                  ? "Escolar"
                                  : bundle.type === "ORGANIZATION_PACKAGE"
                                    ? "Organizacional"
                                    : "Regular"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(
                                typeof bundle.basePrice === "string"
                                  ? Number.parseFloat(bundle.basePrice)
                                  : bundle.basePrice,
                              )}
                            </span>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Package className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <p className="text-center py-4 text-muted-foreground">No se encontraron paquetes</p>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Ingresa al menos 2 caracteres para buscar</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Carrito */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Carrito <span className="text-destructive">*</span>
              </h3>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCart([])}
                  className="text-destructive hover:text-destructive"
                >
                  Vaciar
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-muted/30">
                <p className="text-muted-foreground">El carrito está vacío</p>
                {cartError && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-2 justify-center">
                    <AlertCircle className="h-3 w-3" />
                    Debes agregar al menos un producto
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  <AnimatePresence>
                    {cart.map((item, index) => (
                      <motion.div
                        key={item.itemId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
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
                            {item.allowPreSale && item.stock !== undefined && item.quantity > item.stock && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                Pre-venta
                              </Badge>
                            )}
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex justify-between items-center p-3 border-t pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}
          </div>

          {/* Datos del beneficiario (solo para ventas de paquetes) */}
          {selectedBundle && (
            <div
              className={`space-y-4 border p-4 rounded-md ${beneficiaryError ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30" : "bg-muted/30"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  Datos del Beneficiario <span className="text-destructive">*</span>
                </h3>
                {beneficiaryError && (
                  <Badge variant="destructive" className="text-xs">
                    Datos incompletos
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={beneficiaryFirstName}
                    onChange={(e) => setBeneficiaryFirstName(e.target.value)}
                    placeholder="Nombre del beneficiario"
                    className={beneficiaryError && !beneficiaryFirstName ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={beneficiaryLastName}
                    onChange={(e) => setBeneficiaryLastName(e.target.value)}
                    placeholder="Apellido del beneficiario"
                    className={beneficiaryError && !beneficiaryLastName ? "border-destructive" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">Escuela</Label>
                <Input
                  id="school"
                  value={beneficiarySchool}
                  onChange={(e) => setBeneficiarySchool(e.target.value)}
                  placeholder="Nombre de la escuela"
                  className={beneficiaryError && !beneficiarySchool ? "border-destructive" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Input
                    id="level"
                    value={beneficiaryLevel}
                    onChange={(e) => setBeneficiaryLevel(e.target.value)}
                    placeholder="Ej: 5to Año"
                    className={beneficiaryError && !beneficiaryLevel ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Sección</Label>
                  <Input
                    id="section"
                    value={beneficiarySection}
                    onChange={(e) => setBeneficiarySection(e.target.value)}
                    placeholder="Ej: A"
                    className={beneficiaryError && !beneficiarySection ? "border-destructive" : ""}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Método de pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionReference">Referencia (opcional)</Label>
              <Input
                id="transactionReference"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Número de recibo, transacción, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {loading ? "Procesando..." : "Completar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

