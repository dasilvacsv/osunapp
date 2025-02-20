'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  User, 
  Calendar, 
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Receipt,
  ChevronDown
} from 'lucide-react';
import { updatePurchaseStatus } from '@/features/sales/actions';
import { useToast } from '@/hooks/use-toast';
import { StatusTimeline } from '@/features/sales/status-timeline';
import { cn } from "@/lib/utils";

const statusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En Proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  IN_PROGRESS: Package,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle
};

const statusColors = {
  PENDING: {
    light: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dark: "dark:bg-black/40 dark:text-yellow-300 dark:border-yellow-800/30"
  },
  APPROVED: {
    light: "bg-blue-100 text-blue-800 border-blue-200",
    dark: "dark:bg-black/40 dark:text-blue-300 dark:border-blue-800/30"
  },
  IN_PROGRESS: {
    light: "bg-purple-100 text-purple-800 border-purple-200",
    dark: "dark:bg-black/40 dark:text-purple-300 dark:border-purple-800/30"
  },
  COMPLETED: {
    light: "bg-green-100 text-green-800 border-green-200",
    dark: "dark:bg-black/40 dark:text-green-300 dark:border-green-800/30"
  },
  CANCELLED: {
    light: "bg-red-100 text-red-800 border-red-200",
    dark: "dark:bg-black/40 dark:text-red-300 dark:border-red-800/30"
  }
};

export function SaleDetails({ sale }: { sale: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(sale.status);
  const [isPending, startTransition] = useTransition();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

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
          const StatusIcon = statusIcons[newStatus as keyof typeof statusIcons];
          
          toast({
            title: (
              <div className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Estado actualizado
              </div>
            ),
            description: `La venta ahora está ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()}`,
            className: cn(
              statusColors[newStatus as keyof typeof statusColors].light,
              statusColors[newStatus as keyof typeof statusColors].dark,
              "border-2"
            )
          });
        } else {
          throw new Error(result.error || "Error al actualizar el estado");
        }
      } catch (error) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </div>
          ),
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive"
        });
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between bg-white dark:bg-black/40 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-gray-100/50 dark:border-gray-800/50"
        >
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="group hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Volver a ventas
          </Button>

          <div className="flex items-center gap-4">
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
              disabled={isPending}
            >
              <SelectTrigger 
                className={cn(
                  "w-[280px] h-11 transition-all duration-300",
                  "bg-white dark:bg-black/40 backdrop-blur-sm",
                  "border border-gray-200 dark:border-gray-800",
                  "hover:border-gray-300 dark:hover:border-gray-700",
                  "rounded-xl shadow-sm",
                  "text-gray-900 dark:text-gray-100",
                  "flex items-center justify-between",
                  "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-opacity-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {currentStatus && (
                    <>
                      {(() => {
                        const StatusIcon = statusIcons[currentStatus as keyof typeof statusIcons];
                        return <StatusIcon className="h-4 w-4" />;
                      })()}
                    </>
                  )}
                  <SelectValue 
                    placeholder="Seleccionar estado" 
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg backdrop-blur-sm">
                {Object.entries(statusLabels).map(([value, label]) => {
                  const StatusIcon = statusIcons[value as keyof typeof statusIcons];
                  return (
                    <SelectItem 
                      key={value} 
                      value={value}
                      className={cn(
                        "flex items-center gap-3 py-3 px-4 cursor-pointer",
                        "text-gray-900 dark:text-gray-100",
                        "hover:bg-gray-50 dark:hover:bg-gray-900/50",
                        "transition-colors duration-200",
                        "rounded-lg mx-1 my-0.5"
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {isPending && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Actualizando...</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-black/40 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm border border-gray-100/50 dark:border-gray-800/50"
        >
          <div className="border-b border-gray-100 dark:border-gray-800/50 p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Venta #{sale.id.slice(0, 8)}
                </h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {formatDate(sale.purchaseDate)}
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  statusColors[currentStatus as keyof typeof statusColors].light,
                  statusColors[currentStatus as keyof typeof statusColors].dark,
                  "px-6 py-2.5 text-sm font-medium rounded-full border-2",
                  "shadow-sm backdrop-blur-sm"
                )}
              >
                {statusLabels[currentStatus as keyof typeof statusLabels]}
              </Badge>
            </div>
          </div>

          <div className="px-16 py-12">
            <StatusTimeline currentStatus={currentStatus} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8 bg-gray-50/50 dark:bg-black/60">
            <motion.div
              variants={itemVariants}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <User className="h-5 w-5" />
                Información del Cliente
              </div>
              <div className="bg-white dark:bg-black/40 rounded-xl p-6 shadow-lg space-y-3 border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">{sale.client?.name || 'Cliente no registrado'}</p>
                <p className="text-gray-500 dark:text-gray-400">{sale.client?.document}</p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <CreditCard className="h-5 w-5" />
                Método de Pago
              </div>
              <div className="bg-white dark:bg-black/40 rounded-xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm">
                <Badge 
                  variant="outline" 
                  className="text-base px-6 py-2.5 rounded-full shadow-sm backdrop-blur-sm"
                >
                  {sale.paymentMethod === 'CASH' ? 'Efectivo' :
                   sale.paymentMethod === 'CARD' ? 'Tarjeta' :
                   sale.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                   sale.paymentMethod}
                </Badge>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="p-8 space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Package className="h-5 w-5" />
              Productos
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {sale.items.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex justify-between items-center p-6",
                      "bg-white dark:bg-black/40 rounded-xl shadow-lg",
                      "transform transition-all duration-300",
                      "border border-gray-100/50 dark:border-gray-800/50",
                      "hover:border-gray-200 dark:hover:border-gray-700",
                      "backdrop-blur-sm",
                      hoveredItem === index && "scale-[1.02] shadow-xl"
                    )}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.inventoryItem?.name || 'Producto eliminado'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatCurrency(item.totalPrice)}
                      </p>
                      {hoveredItem === index && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2"
                        >
                          <Tag className="h-4 w-4" />
                          SKU: {item.inventoryItem?.sku || 'N/A'}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-8 bg-gray-50/50 dark:bg-black/60 border-t border-gray-100 dark:border-gray-800/50"
          >
            <div className="flex justify-end items-center">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total de la venta</p>
                <div className="flex items-center gap-3">
                  <Receipt className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}