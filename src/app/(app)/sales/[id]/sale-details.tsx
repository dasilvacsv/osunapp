'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Package, User, Calendar, CreditCard } from 'lucide-react';
import { updatePurchaseStatus } from '@/features/sales/actions';
import { useToast } from '@/hooks/use-toast';
import { StatusTimeline } from '@/features/sales/status-timeline';

const statusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En Proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

export function SaleDetails({ sale }: { sale: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(sale.status);
  const [isPending, startTransition] = useTransition();

  // Validar que el estado esté dentro de los valores permitidos
  const isValidStatus = (status: string): boolean => {
    return Object.keys(statusLabels).includes(status);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!isValidStatus(newStatus)) {
      toast({
        title: "Error",
        description: "El estado seleccionado no es válido.",
        variant: "destructive"
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePurchaseStatus(sale.id, newStatus);

        if (result.success) {
          setCurrentStatus(newStatus);
          toast({
            title: "Estado actualizado",
            description: `La venta ahora está ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()}`,
            className: "bg-green-500 text-white"
          });
        } else {
          throw new Error(result.error || "Error al actualizar el estado");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a ventas
        </Button>

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
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem 
                  key={value} 
                  value={value}
                  className="capitalize"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg p-6 shadow-lg border"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Venta #{sale.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(sale.purchaseDate)}
            </div>
          </div>
        </div>
        <StatusTimeline currentStatus={currentStatus} />
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              Información del Cliente
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium">{sale.client?.name || 'Cliente no registrado'}</p>
              <p className="text-muted-foreground">{sale.client?.document}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5" />
              Método de Pago
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <Badge variant="outline" className="text-base">
                {sale.paymentMethod === 'CASH' ? 'Efectivo' :
                 sale.paymentMethod === 'CARD' ? 'Tarjeta' :
                 sale.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                 sale.paymentMethod}
              </Badge>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            Productos
          </div>
          <div className="space-y-3">
            {sale.items.map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                className="flex justify-between items-center p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div>
                  <p className="font-medium">{item.inventoryItem?.name || 'Producto eliminado'}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(item.totalPrice)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-4 border-t flex justify-end"
        >
          <div className="text-2xl font-bold">
            Total: {formatCurrency(sale.totalAmount)}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}