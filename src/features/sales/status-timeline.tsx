"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, DollarSign } from "lucide-react"

const statusOrder = ["PENDING", "IN_PROGRESS", "COMPLETED"]

const statusConfig = {
  PENDING: {
    label: "Deudor",
    icon: DollarSign,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    lineColor: "bg-amber-200 dark:bg-amber-700/30",
  },
  IN_PROGRESS: {
    label: "Solvente",
    icon: CheckCircle2,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    lineColor: "bg-blue-200 dark:bg-blue-700/30",
  },
  COMPLETED: {
    label: "Completado",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    lineColor: "bg-emerald-200 dark:bg-emerald-700/30",
  },
  CANCELLED: {
    label: "Anulado",
    icon: XCircle,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300",
    lineColor: "bg-rose-200 dark:bg-rose-700/30",
  },
}

export function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isCancelled = currentStatus === "CANCELLED"
  const currentIndex = statusOrder.indexOf(currentStatus)
  const validStatus = currentIndex === -1 ? 0 : currentIndex

  return (
    <div className="relative px-4 py-8 sm:px-8 min-h-[200px]">
      <AnimatePresence mode="wait">
        {!isCancelled ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Línea de progreso base */}
            <div
              className="absolute top-[2.25rem] left-[2.25rem] right-[2.25rem] h-1 bg-gray-100 dark:bg-gray-800 rounded-full"
              style={{ width: "calc(100% - 4.5rem)" }}
            />

            {/* Línea de progreso animada */}
            <motion.div
              className="absolute top-[2.25rem] left-[2.25rem] h-1 bg-gradient-to-r from-primary/50 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${(validStatus / (statusOrder.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ maxWidth: "calc(100% - 4.5rem)" }}
            />

            {/* Puntos de estado */}
            <div className="relative flex justify-between items-start">
              {statusOrder.map((status, index) => {
                const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon
                const isActive = index <= validStatus
                const config = statusConfig[status as keyof typeof statusConfig]

                return (
                  <div key={status} className="relative flex flex-col items-center flex-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: index * 0.1 
                      }}
                      className="relative"
                    >
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                          "transition-all duration-300 transform",
                          isActive ? config.color : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                        )}
                      >
                        <StatusIcon className="h-5 w-5" />
                      </motion.div>
                    </motion.div>

                    {/* Etiqueta */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={cn(
                        "mt-4 text-sm font-medium text-center whitespace-nowrap px-2",
                        isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {config.label}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <motion.div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                  statusConfig.CANCELLED.color
                )}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <XCircle className="h-8 w-8" />
              </motion.div>
              <motion.div
                className="absolute -inset-3 rounded-full bg-rose-500/30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-xl font-semibold text-center text-rose-700 dark:text-rose-300"
            >
              {statusConfig.CANCELLED.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}