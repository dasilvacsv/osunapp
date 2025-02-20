'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Clock, XCircle } from 'lucide-react';

const statusOrder = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-500'
  },
  APPROVED: {
    label: 'Aprobado',
    icon: Check,
    color: 'text-blue-500'
  },
  IN_PROGRESS: {
    label: 'En Proceso',
    icon: Clock,
    color: 'text-purple-500'
  },
  COMPLETED: {
    label: 'Completado',
    icon: Check,
    color: 'text-green-500'
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-500'
  }
};

export function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const validStatus = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="relative">
      {/* Línea de progreso base */}
      <div className="absolute h-1 bg-muted w-full rounded-full" />
      
      {/* Línea de progreso animada */}
      <motion.div
        className="absolute h-1 bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(validStatus * 100) / (statusOrder.length - 1)}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Puntos de estado */}
      <div className="relative flex justify-between items-center h-28">
        {statusOrder.map((status, index) => {
          const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon;
          const isActive = index <= validStatus;
          const isPast = index < validStatus;

          return (
            <div key={status} className="relative flex flex-col items-center">
              {/* Punto de estado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <StatusIcon className="h-4 w-4" />
              </motion.div>

              {/* Línea conectora */}
              {index < statusOrder.length - 1 && (
                <div className="absolute left-8 w-[calc(100%-2rem)] h-0.5 -translate-y-4" />
              )}

              {/* Etiqueta */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  "absolute top-full mt-2 text-sm font-medium whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {statusConfig[status as keyof typeof statusConfig].label}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}