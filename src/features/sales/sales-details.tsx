// components/sales-details.tsx
'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"

export function SalesDetails({ sale, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de Venta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Cliente</h3>
              <p>{sale.client.name}</p>
              <p className="text-sm text-muted-foreground">
                {sale.client.document}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">Fecha de Compra</h3>
              <p>{formatDate(sale.purchaseDate)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Estado de Transacción</h3>
            <Badge 
              variant={
                sale.status === 'COMPLETED' ? 'default' :
                sale.status === 'PENDING' ? 'secondary' :
                'destructive'
              }
            >
              {sale.status}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Métodos de Pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>Método principal</p>
                <Badge variant="outline">{sale.paymentMethod}</Badge>
              </div>
              {sale.bookingMethod && (
                <div>
                  <p>Método de reserva</p>
                  <Badge variant="outline">{sale.bookingMethod}</Badge>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Productos</h3>
            <div className="space-y-2">
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.inventoryItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p>{formatCurrency(item.quantity * item.unitPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right font-semibold text-lg">
            Total: {formatCurrency(sale.totalAmount)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}