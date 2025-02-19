// new-sale-dialog.tsx
'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createPurchase } from "./actions"
import { useState, useEffect, useRef } from "react"
import { searchClients } from "@/app/(app)/clientes/client"
import { searchInventory } from "@/features/inventory/actions"

export default function NewSaleDialog({ open, onOpenChange, onSuccess }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    items: [] as Array<{ itemId: string; quantity: number }>,
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

  const inventorySearchRef = useRef<HTMLInputElement>(null)

  // Búsqueda de clientes optimizada
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (clientSearch.length > 1) {
        const result = await searchClients(clientSearch)
        if (result.success) {
          setClientResults(result.data)
          setShowResults(prev => ({ ...prev, client: true }))
        }
      } else {
        setClientResults([])
        setShowResults(prev => ({ ...prev, client: false }))
      }
    }, 200)

    return () => clearTimeout(handler)
  }, [clientSearch])

  // Búsqueda de inventario optimizada
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (inventorySearch.length > 1) {
        const result = await searchInventory(inventorySearch)
        if (result.success) {
          setInventoryResults(result.data)
          setShowResults(prev => ({ ...prev, inventory: true }))
        }
      } else {
        setInventoryResults([])
        setShowResults(prev => ({ ...prev, inventory: false }))
      }
    }, 200)

    return () => clearTimeout(handler)
  }, [inventorySearch])

  const addItem = (item: any) => {
    if (item.currentStock <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Producto sin stock disponible" })
      return
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: item.id, quantity: 1 }]
    }))
    
    // Mantener foco y resultados visibles
    setTimeout(() => {
      inventorySearchRef.current?.focus()
      setShowResults(prev => ({ ...prev, inventory: true }))
    }, 10)
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const inventoryItem = inventoryResults.find(i => i.id === item.itemId)
      return total + (inventoryItem?.basePrice || 0) * item.quantity
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
        toast({ title: "Venta registrada", description: "La venta se ha registrado correctamente" })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda de cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="relative">
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onFocus={() => setShowResults(prev => ({ ...prev, client: true }))}
                onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, client: false })), 200)}
              />
              
              {showResults.client && clientResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10 max-h-60 overflow-auto">
                  {clientResults.map(client => (
                    <div
                      key={client.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setFormData(prev => ({ ...prev, clientId: client.id }))
                        setClientSearch(client.name)
                        setShowResults(prev => ({ ...prev, client: false }))
                      }}
                    >
                      {client.name} - {client.document}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Búsqueda de productos */}
          <div className="space-y-2">
            <Label>Productos</Label>
            <div className="relative">
              <Input
                ref={inventorySearchRef}
                placeholder="Buscar productos..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                onFocus={() => setShowResults(prev => ({ ...prev, inventory: true }))}
                onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, inventory: false })), 200)}
              />
              
              {showResults.inventory && inventoryResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10 max-h-60 overflow-auto">
                  {inventoryResults.map(item => (
                    <div
                      key={item.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        addItem(item)
                      }}
                    >
                      <div className="flex justify-between">
                        <span>{item.name}</span>
                        <span>Stock: {item.currentStock}</span>
                      </div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de productos seleccionados */}
            <div className="space-y-2">
              {formData.items.map((item, index) => {
                const inventoryItem = inventoryResults.find(i => i.id === item.itemId)
                return (
                  <div key={index} className="flex items-center gap-4 p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{inventoryItem?.name || 'Producto no encontrado'}</p>
                      <p className="text-sm text-gray-500">{inventoryItem?.sku}</p>
                    </div>
                    
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
                      className="w-20"
                    />
                    
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => setFormData({
                        ...formData,
                        items: formData.items.filter((_, i) => i !== index)
                      })}
                    >
                      Eliminar
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          {/* Total */}
          <div className="text-right text-xl font-bold">
            Total: {calculateTotal().toLocaleString('es-ES', {
              style: 'currency',
              currency: 'USD'
            })}
          </div>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Procesando..." : "Finalizar Venta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}