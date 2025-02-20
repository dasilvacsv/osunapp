'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createPurchase } from "./actions"
import { useState, useEffect, useRef } from "react"
import { searchClients } from "@/app/(app)/clientes/client"
import { searchInventory, getInventoryItem } from "@/features/inventory/actions"
import { searchBundles } from "./actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, User, CreditCard, Trash2, Package, Search, DollarSign, AlertCircle, Plus, Minus, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"
import { type Toast } from "@/components/ui/toast"

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SaleItem {
  itemId: string;
  quantity: number;
  overridePrice?: number;
}

interface FormData {
  clientId: string;
  items: SaleItem[];
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
}

export default function NewSaleDialog({ open, onOpenChange, onSuccess }: NewSaleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    items: [],
    paymentMethod: 'CASH'
  })
  
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<any[]>([])
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryResults, setInventoryResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState({
    client: false,
    inventory: false
  })

  const [activeTab, setActiveTab] = useState<'items' | 'bundles'>('items')
  const [bundleSearch, setBundleSearch] = useState('')
  const [bundleResults, setBundleResults] = useState<any[]>([])
  const [showBundleResults, setShowBundleResults] = useState(false)
  const [itemsCache, setItemsCache] = useState<Record<string, any>>({})

  const inventorySearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (clientSearch.length > 1) {
        const result = await searchClients(clientSearch)
        if (result.success) {
          setClientResults(result.data ?? [])
          setShowResults(prev => ({ ...prev, client: true }))
        }
      } else {
        setClientResults([])
        setShowResults(prev => ({ ...prev, client: false }))
      }
    }, 200)

    return () => clearTimeout(handler)
  }, [clientSearch])

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (inventorySearch.length > 1) {
        const result = await searchInventory(inventorySearch)
        if (result.success) {
          setInventoryResults(result.data ?? [])
          setShowResults(prev => ({ ...prev, inventory: true }))
        }
      } else {
        setInventoryResults([])
        setShowResults(prev => ({ ...prev, inventory: false }))
      }
    }, 200)

    return () => clearTimeout(handler)
  }, [inventorySearch])

  // Bundle search effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (bundleSearch.length > 1) {
        const result = await searchBundles(bundleSearch)
        if (result.success) {
          setBundleResults(result.data ?? [])
          setShowBundleResults(true)
        }
      } else {
        setBundleResults([])
        setShowBundleResults(false)
      }
    }, 200)

    return () => clearTimeout(handler)
  }, [bundleSearch])

  // Add effect to fetch missing items
  useEffect(() => {
    const fetchMissingItems = async () => {
      const missingItems = formData.items.filter(
        item => !itemsCache[item.itemId] && !inventoryResults.find(i => i.id === item.itemId)
      );

      if (missingItems.length > 0) {
        const itemDetails = await Promise.all(
          missingItems.map(item => getInventoryItem(item.itemId))
        );

        const newCache = { ...itemsCache };
        itemDetails.forEach((result, index) => {
          if (result.success) {
            newCache[missingItems[index].itemId] = result.data;
          }
        });

        setItemsCache(newCache);
      }
    };

    fetchMissingItems();
  }, [formData.items, itemsCache, inventoryResults]);

  // Add helper function to get item details
  const getItemDetails = (itemId: string) => {
    return itemsCache[itemId] || inventoryResults.find(i => i.id === itemId);
  };

  const addBundle = (bundle: any) => {
    // Check if all items in bundle have sufficient stock
    const insufficientItems = bundle.items.filter(
      (bundleItem: any) => bundleItem.item.currentStock < bundleItem.quantity
    );
  
    if (insufficientItems.length > 0) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Algunos productos del paquete no tienen suficiente stock`,
      });
      return;
    }
  
    // Add all bundle items to the sale
    const newItems = [...formData.items];
    
    bundle.items.forEach((bundleItem: any) => {
      const existingItemIndex = newItems.findIndex(i => i.itemId === bundleItem.item.id); // This was the issue
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        newItems[existingItemIndex].quantity += bundleItem.quantity;
      } else {
        // Add new item
        newItems.push({
          itemId: bundleItem.item.id, // This was the issue
          quantity: bundleItem.quantity,
          overridePrice: bundleItem.overridePrice || bundleItem.item.basePrice
        });
      }
    });
  
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  
    setBundleSearch('');
    setShowBundleResults(false);
  };

  const addItem = (item: any) => {
    if (item.currentStock <= 0) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Producto sin stock disponible",
      })
      return
    }
    
    const existingItemIndex = formData.items.findIndex(i => i.itemId === item.id)
    
    if (existingItemIndex !== -1) {
      const newItems = [...formData.items]
      if (newItems[existingItemIndex].quantity < item.currentStock) {
        newItems[existingItemIndex].quantity += 1
        setFormData(prev => ({ ...prev, items: newItems }))
      } else {
        toast({ 
          variant: "destructive", 
          title: "Stock máximo alcanzado", 
          description: "No hay más unidades disponibles de este producto",
        })
      }
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { itemId: item.id, quantity: 1 }]
      }))
    }
    
    setTimeout(() => {
      inventorySearchRef.current?.focus()
      setShowResults(prev => ({ ...prev, inventory: true }))
    }, 10)
  }

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...formData.items]
    const item = newItems[index]
    const inventoryItem = getItemDetails(item.itemId)
    
    if (!inventoryItem) return

    const newQuantity = item.quantity + delta
    if (newQuantity > 0 && newQuantity <= inventoryItem.currentStock) {
      newItems[index].quantity = newQuantity
      setFormData({ ...formData, items: newItems })
    }
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const inventoryItem = getItemDetails(item.itemId)
      const price = item.overridePrice || inventoryItem?.basePrice || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      if (!formData.clientId) {
        throw new Error("Selecciona un cliente")
      }
      
      if (formData.items.length === 0) {
        throw new Error("Agrega al menos un producto")
      }

      const result = await createPurchase(formData)
      
      if (result.success) {
        toast({ 
          title: "¡Éxito!", 
          description: "La venta se ha registrado correctamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStockClassName = (stock: number) => {
    if (stock > 10) return 'bg-success/20 text-success-foreground'
    if (stock > 0) return 'bg-warning/20 text-warning-foreground'
    return 'bg-destructive/20 text-destructive-foreground'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShoppingCart className="w-6 h-6 text-foreground" />
            Nueva Venta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client search section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-lg font-medium text-foreground">
              <User className="w-5 h-5" />
              Cliente
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  className="pl-10 transition-all duration-200 bg-background border-input hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Buscar cliente por nombre o documento..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => setShowResults(prev => ({ ...prev, client: true }))}
                  onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, client: false })), 200)}
                />
              </div>
              
              <AnimatePresence>
                {showResults.client && clientResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-auto"
                  >
                    {clientResults.map(client => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors duration-150"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setFormData(prev => ({ ...prev, clientId: client.id }))
                          setClientSearch(client.name)
                          setShowResults(prev => ({ ...prev, client: false }))
                        }}
                      >
                        <div className="font-medium text-foreground">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.document}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Products/Bundles Tabs */}
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'items' | 'bundles')}>
              <TabsList className="w-full">
                <TabsTrigger value="items" className="flex-1">
                  <Package className="w-4 h-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="bundles" className="flex-1">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Paquetes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        ref={inventorySearchRef}
                        className="pl-10 transition-all duration-200 bg-background border-input hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20"
                        placeholder="Buscar productos por nombre o SKU..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        onFocus={() => setShowResults(prev => ({ ...prev, inventory: true }))}
                        onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, inventory: false })), 200)}
                      />
                    </div>
                    
                    <AnimatePresence>
                      {showResults.inventory && inventoryResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-auto"
                        >
                          {inventoryResults.map(item => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="p-3 hover:bg-accent cursor-pointer transition-colors duration-150"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                addItem(item)
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">{item.name}</span>
                                <span className={`text-sm px-2 py-1 rounded ${getStockClassName(item.currentStock)}`}>
                                  Stock: {item.currentStock}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">{item.sku}</div>
                              <div className="text-sm font-semibold mt-1">
                                {formatCurrency(item.basePrice)}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bundles" className="mt-4">
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        className="pl-10 transition-all duration-200 bg-background border-input hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20"
                        placeholder="Buscar paquetes por nombre..."
                        value={bundleSearch}
                        onChange={(e) => setBundleSearch(e.target.value)}
                        onFocus={() => setShowBundleResults(true)}
                        onBlur={() => setTimeout(() => setShowBundleResults(false), 200)}
                      />
                    </div>

                    <AnimatePresence>
                      {showBundleResults && bundleResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-auto"
                        >
                          {bundleResults.map(bundle => (
                            <motion.div
                              key={bundle.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="p-3 hover:bg-accent cursor-pointer transition-colors duration-150"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                addBundle(bundle)
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">{bundle.name}</span>
                                <span className="text-sm font-semibold">
                                  {formatCurrency(bundle.basePrice)}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {bundle.items.length} productos incluidos
                              </div>
                              <div className="mt-2 space-y-1">
                                {bundle.items.map((item: any) => (
                                  <div key={item.id} className="text-sm flex justify-between items-center">
                                    <span>{item.item.name}</span>
                                    <span className="text-xs">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Selected items list */}
            <div className="space-y-3 mt-4">
              <AnimatePresence>
                {formData.items.map((item, index) => {
                  const inventoryItem = getItemDetails(item.itemId)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {inventoryItem?.name || 'Cargando...'}
                        </p>
                        <p className="text-sm text-muted-foreground">{inventoryItem?.sku}</p>
                        <p className="text-sm font-semibold mt-1">
                          {formatCurrency((item.overridePrice || inventoryItem?.basePrice || 0) * item.quantity)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-background rounded-lg border border-input p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(index, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            min="1"
                            max={inventoryItem?.currentStock || 1}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formData.items]
                              newItems[index].quantity = Math.min(
                                Number(e.target.value),
                                inventoryItem?.currentStock || 1
                              )
                              setFormData({ ...formData, items: newItems })
                            }}
                            className="w-16 text-center bg-background border-0 focus-visible:ring-0"
                          />
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(index, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="destructive"
                                size="icon"
                                onClick={() => setFormData({
                                  ...formData,
                                  items: formData.items.filter((_, i) => i !== index)
                                })}
                                className="hover:bg-destructive/90 transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar producto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-lg font-medium text-foreground">
              <CreditCard className="w-5 h-5" />
              Método de Pago
            </Label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'CASH' | 'CARD' | 'TRANSFER' }))}
              className="w-full p-2.5 rounded-lg bg-background border border-input hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
            >
              <option value="CASH">💵 Efectivo</option>
              <option value="CARD">💳 Tarjeta</option>
              <option value="TRANSFER">🏦 Transferencia</option>
            </select>
          </div>

          {/* Total */}
          <motion.div 
            className="flex justify-between items-center p-4 bg-muted rounded-lg"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <span className="text-lg font-medium flex items-center gap-2 text-foreground">
              <DollarSign className="w-5 h-5" />
              Total
            </span>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(calculateTotal())}
            </span>
          </motion.div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full py-6 text-lg font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-foreground text-background hover:bg-foreground/90"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Procesando...
              </div>
            ) : (
              "Finalizar Venta"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}