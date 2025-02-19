// components/sales-details.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusTimeline } from "./status-timeline"
import { updatePurchaseStatus } from '@/features/sales/actions'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SalesDetails({ sale, open, onOpenChange }) {
  const { toast } = useToast()
  const [currentStatus, setCurrentStatus] = useState(sale.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      const result = await updatePurchaseStatus(sale.id, newStatus)
      
      if (result.success) {
        setCurrentStatus(newStatus)
        toast({
          title: "Estado actualizado",
          description: `El estado de la venta se ha cambiado a ${newStatus.toLowerCase()}`
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de Venta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <StatusTimeline currentStatus={currentStatus} />
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Estado Actual</h3>
                <Select 
                  value={currentStatus} 
                  onValueChange={handleStatusChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                      <SelectItem 
                        key={status} 
                        value={status}
                        className="capitalize"
                      >
                        {status.toLowerCase().replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Métodos de Booking</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Principal:</span>
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                  </div>
                  {sale.bookingMethod && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Reserva:</span>
                      <Badge variant="outline">{sale.bookingMethod}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="space-y-1">
                  <p>{sale.client?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.client?.document || 'Sin documento'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Fecha</h3>
                <p>{formatDate(sale.purchaseDate)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Productos</h3>
            <div className="space-y-3">
              {sale.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{(item as any).inventoryItem?.name || 'Producto no disponible'}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-right text-2xl font-bold border-t pt-4">
            Total: {formatCurrency(sale.totalAmount)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}