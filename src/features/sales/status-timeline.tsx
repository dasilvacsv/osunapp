'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Clock, XCircle, Truck } from 'lucide-react';

const statusOrder = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    lineColor: 'bg-amber-200 dark:bg-amber-700/30'
  },
  APPROVED: {
    label: 'Entregado',
    icon: Check,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    lineColor: 'bg-blue-200 dark:bg-blue-700/30'
  },
  IN_PROGRESS: {
    label: 'En Proceso',
    icon: Truck,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    lineColor: 'bg-purple-200 dark:bg-purple-700/30'
  },
  COMPLETED: {
    label: 'Completado',
    icon: Check,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    lineColor: 'bg-emerald-200 dark:bg-emerald-700/30'
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
    lineColor: 'bg-rose-200 dark:bg-rose-700/30'
  }
};

export function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const validStatus = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="relative px-4 sm:px-8">
      {/* Base progress line */}
      <div 
        className="absolute top-4 left-[2.25rem] right-[2.25rem] h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
        style={{ width: 'calc(100% - 4.5rem)' }}
      />
      
      {/* Animated progress line */}
      <motion.div
        className="absolute top-4 left-[2.25rem] h-0.5 bg-primary rounded-full"
        initial={{ width: '0%' }}
        animate={{ 
          width: `${(validStatus * (100 / (statusOrder.length - 1)))}%`
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ maxWidth: 'calc(100% - 4.5rem)' }}
      />

      {/* Status points */}
      <div className="relative flex justify-between items-start">
        {statusOrder.map((status, index) => {
          const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon;
          const isActive = index <= validStatus;
          const isPast = index < validStatus;
          const config = statusConfig[status as keyof typeof statusConfig];

          return (
            <div 
              key={status} 
              className="relative flex flex-col items-center"
              style={{ minWidth: '4rem' }}
            >
              {/* Status point */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  "transition-all duration-300 transform",
                  isActive ? config.color : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                  isActive && "scale-110"
                )}
              >
                <StatusIcon className="h-4 w-4" />
              </motion.div>

              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  "mt-3 text-sm font-medium text-center",
                  isActive 
                    ? "text-gray-900 dark:text-gray-100" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {config.label}
              </motion.div>

              {/* Hover effect */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute inset-0 cursor-pointer transition-colors duration-200"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}