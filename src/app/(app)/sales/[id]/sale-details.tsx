'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import { updatePurchaseStatus } from '@/features/sales/actions'
import { useToast } from '@/hooks/use-toast'

export function SaleDetails({ sale }: { sale: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStatus, setCurrentStatus] = useState(sale.status)
  const [isPending, startTransition] = useTransition()

  const statusOrder = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']
  const currentIndex = statusOrder.indexOf(currentStatus)

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        const result = await updatePurchaseStatus(sale.id, newStatus)
        
        if (result.success) {
          setCurrentStatus(newStatus)
          toast({
            title: "✅ Estado actualizado",
            description: `El estado se cambió a ${newStatus.toLowerCase().replace('_', ' ')}`,
          })
        } else {
          throw new Error(result.error || "Error al actualizar el estado")
        }
      } catch (error) {
        toast({
          title: "❌ Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4"
      >
        ← Volver a ventas
      </Button>
      
      <div className="flex justify-between items-start">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
          >
            Venta #{sale.id.slice(0, 8)}
          </motion.h1>
          <p className="text-sm text-gray-500">{formatDate(sale.purchaseDate)}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOrder.map((status) => (
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
          
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* Línea de tiempo */}
      <div className="relative h-2 bg-gray-200 rounded-full w-full max-w-2xl my-8">
        {statusOrder.map((status, index) => (
          <div 
            key={status} 
            className="absolute -top-3.5" 
            style={{ left: `${(index * 100) / (statusOrder.length - 1)}%` }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2
                ${index <= currentIndex ? 'bg-primary border-primary' : 'bg-background border-gray-300'}
              `}
            >
              {index < currentIndex && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-medium capitalize whitespace-nowrap"
            >
              {status.toLowerCase().replace('_', ' ')}
            </motion.div>
          </div>
        ))}
        
        <motion.div
          className="absolute h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex * 100) / (statusOrder.length - 1)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Cliente</h3>
          <p>{sale.client?.name || 'Cliente no registrado'}</p>
          <p className="text-sm text-gray-500">{sale.client?.document}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Método de Pago</h3>
          <Badge variant="outline">{sale.paymentMethod}</Badge>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Productos</h3>
        <div className="space-y-2">
          {sale.items.map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center p-3 border rounded"
            >
              <div>
                <p className="font-medium">{(item as any).inventoryItem?.name || 'Producto eliminado'}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p>{formatCurrency(item.totalPrice)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-right text-xl font-bold"
      >
        Total: {formatCurrency(sale.totalAmount)}
      </motion.div>
    </div>
  )
}