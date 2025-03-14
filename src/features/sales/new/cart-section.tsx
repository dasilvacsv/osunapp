"use client"

import { useState, memo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash, Plus, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ProductSelect } from "./selectors/product-select"
import { BundleSelect } from "./selectors/bundle-select"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { Control } from "react-hook-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SaleTypeSelector } from "./selectors/sale-type-selector"

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
  isFromBundle?: boolean
  bundleId?: string
}

interface CartSectionProps {
  control: Control<any>
  initialItems: InventoryItem[]
  initialBundles: Bundle[]
  onCartChange: (cart: CartItem[]) => void
  onTotalChange: (total: number) => void
  onSaleTypeChange: (type: "DIRECT" | "PRESALE") => void
  selectedBundleId?: string
  onBundleSelect?: (bundleId: string, bundle: Bundle) => void
}

export const CartSection = memo(function CartSection({
  control,
  initialItems,
  initialBundles,
  onCartChange,
  onTotalChange,
  onSaleTypeChange,
  selectedBundleId,
  onBundleSelect,
}: CartSectionProps) {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>(initialItems)
  const [availableBundles, setAvailableBundles] = useState<Bundle[]>(initialBundles)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([])
  const [bundleResults, setBundleResults] = useState<Bundle[]>([])

  // Get cart value from form
  useEffect(() => {
    const cartValue = control._formValues?.cart
    if (cartValue && Array.isArray(cartValue) && cartValue.length > 0) {
      setCart(cartValue)
    }
  }, [control._formValues?.cart])

  // Reset available items when initialItems changes
  useEffect(() => {
    setAvailableItems(initialItems)
  }, [initialItems])

  // Reset available bundles when initialBundles changes
  useEffect(() => {
    setAvailableBundles(initialBundles)
  }, [initialBundles])

  // Filter products and bundles based on search query
  const filterItems = (query: string) => {
    if (query.length >= 2) {
      const filteredItems = availableItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase()),
      )
      const filteredBundles = availableBundles.filter((bundle) =>
        bundle.name.toLowerCase().includes(query.toLowerCase()),
      )
      setSearchResults(filteredItems)
      setBundleResults(filteredBundles)
    } else {
      setSearchResults([])
      setBundleResults([])
    }
  }

  // Cart functions
  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find((cartItem) => cartItem.itemId === item.id)

    const newCart = existingItem
      ? cart.map((cartItem) =>
          cartItem.itemId === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      : [
          ...cart,
          {
            itemId: item.id,
            name: item.name,
            quantity: 1,
            unitPrice: typeof item.basePrice === "string" ? Number.parseFloat(item.basePrice) : Number(item.basePrice),
            stock: item.currentStock,
            allowPreSale: item.status === "ACTIVE",
          },
        ]

    setCart(newCart)
    onCartChange(newCart)
    onTotalChange(calculateTotal(newCart))
  }

  const removeFromCart = (itemId: string) => {
    const newCart = cart.filter((item) => item.itemId !== itemId)
    setCart(newCart)
    onCartChange(newCart)
    onTotalChange(calculateTotal(newCart))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const newCart = cart.map((item) => (item.itemId === itemId ? { ...item, quantity } : item))

    setCart(newCart)
    onCartChange(newCart)
    onTotalChange(calculateTotal(newCart))
  }

  const addBundleToCart = (bundle: Bundle) => {
    const bundleItems = bundle.items.map((item) => {
      // Get the correct price - use override price if available, otherwise use base price
      const unitPrice = item.overridePrice
        ? typeof item.overridePrice === "string"
          ? Number.parseFloat(item.overridePrice)
          : Number(item.overridePrice)
        : typeof item.item.basePrice === "string"
          ? Number.parseFloat(item.item.basePrice)
          : Number(item.item.basePrice)

      return {
        itemId: item.item.id,
        name: item.item.name,
        quantity: item.quantity,
        unitPrice,
        stock: item.item.currentStock,
        allowPreSale: item.item.status === "ACTIVE",
        isFromBundle: true,
        bundleId: bundle.id,
      }
    })

    const newCart = [...cart, ...bundleItems]
    setCart(newCart)
    onCartChange(newCart)
    onTotalChange(calculateTotal(newCart))
  }

  const clearCart = () => {
    setCart([])
    setAvailableItems(initialItems)
    setAvailableBundles(initialBundles)
    onCartChange([])
    onTotalChange(0)
  }

  const calculateTotal = (cartItems: CartItem[] = cart) => {
    return cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  }

  const handleBundleSelect = (bundleId: string, bundle: Bundle) => {
    // If parent provided a bundle select handler, use it
    if (onBundleSelect) {
      onBundleSelect(bundleId, bundle)

      // The parent will update the form values, which will trigger our useEffect
      // to update the cart state
    } else {
      // Otherwise use local handler
      clearCart()
      addBundleToCart(bundle)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sale Type Selector */}
      <FormField
        control={control}
        name="saleType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Venta</FormLabel>
            <FormControl>
              <SaleTypeSelector
                onTypeChange={(type) => {
                  field.onChange(type)
                  onSaleTypeChange(type)
                }}
                defaultValue={field.value || "DIRECT"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selection Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="bundles">Paquetes</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="pt-4">
          <FormField
            control={control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <FormControl>
                  <ProductSelect
                    selectedProductId={field.value || ""}
                    onProductSelect={(productId, product) => {
                      addToCart(product)
                    }}
                    initialProducts={availableItems}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>

        <TabsContent value="bundles" className="pt-4">
          <FormField
            control={control}
            name="bundleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paquete</FormLabel>
                <FormControl>
                  <BundleSelect
                    selectedBundleId={selectedBundleId || field.value || ""}
                    onBundleSelect={handleBundleSelect}
                    initialBundles={availableBundles}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Cart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Carrito <span className="text-destructive">*</span>
          </h3>
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearCart()
              }}
              type="button"
              className="text-destructive hover:text-destructive"
            >
              Limpiar Carrito
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/30">
            <p className="text-muted-foreground">El carrito está vacío</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {cart.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          updateQuantity(item.itemId, item.quantity - 1)
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          updateQuantity(item.itemId, Number.parseInt(e.target.value) || 1)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 h-8 text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          updateQuantity(item.itemId, item.quantity + 1)
                        }}
                        disabled={item.stock !== undefined && item.quantity >= item.stock && !item.allowPreSale}
                      >
                        <Plus className="h-4 w-4" />
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
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromCart(item.itemId)
                        }}
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
    </div>
  )
})

