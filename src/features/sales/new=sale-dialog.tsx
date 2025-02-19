'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createPurchase } from '@/app/actions'
import { ClientSelector } from '@/components/client-selector'
import { InventoryItemSelector } from '@/components/inventory-item-selector'

export function NewSaleDialog() {
  const [open, setOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [items, setItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const { toast } = useToast()

  const addItem = (item, quantity) => {
    setItems(prev => [...prev, { ...item, quantity }])
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  }

  const handleSubmit = async () => {
    if (!selectedClient || items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Complete todos los campos requeridos" })
      return
    }

    const purchaseData = {
      clientId: selectedClient.id,
      items: items.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        unitPrice: item.basePrice
      })),
      paymentMethod,
      totalAmount: calculateTotal()
    }

    const result = await createPurchase(purchaseData)
    
    if (result.success) {
      toast({ title: "Éxito", description: "Venta registrada correctamente" })
      setOpen(false)
      // Actualizar lista de ventas
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Selección de cliente */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client">Cliente</Label>
            <ClientSelector 
              onSelect={setSelectedClient}
              className="col-span-3"
            />
          </div>

          {/* Búsqueda y selección de items */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>Productos</Label>
            <InventoryItemSelector 
              onSelect={(item) => addItem(item, 1)}
              className="col-span-3"
            />
          </div>

          {/* Lista de items seleccionados */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="flex-1">{item.name}</span>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...items]
                    newItems[index].quantity = parseInt(e.target.value)
                    setItems(newItems)
                  }}
                  className="w-20"
                />
                <span>${item.basePrice * item.quantity}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>

          {/* Método de pago */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment">Método de Pago</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="col-span-3 p-2 border rounded"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          {/* Total */}
          <div className="flex justify-end font-bold text-lg">
            Total: ${calculateTotal()}
          </div>

          <Button onClick={handleSubmit}>Finalizar Venta</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}