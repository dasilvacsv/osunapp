"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Receipt,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCardIcon,
  CalendarRange,
} from "lucide-react"
import { updatePurchaseStatus } from "@/features/sales/actions"
import { useToast } from "@/hooks/use-toast"
import { StatusTimeline } from "@/features/sales/status-timeline"
import { cn } from "@/lib/utils"
import { PaymentsTable } from "@/features/sales/payments-table"
import { PaymentPlanDialog } from "@/features/sales/payment-plan-dialog"
import { getPaymentsByPurchase, getPaymentPlan } from "@/features/sales/payment-actions"

const statusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En Proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  IN_PROGRESS: Package,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
}

const statusColors = {
  PENDING: {
    light: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dark: "dark:bg-black/40 dark:text-yellow-300 dark:border-yellow-800/30",
  },
  APPROVED: {
    light: "bg-blue-100 text-blue-800 border-blue-200",
    dark: "dark:bg-black/40 dark:text-blue-300 dark:border-blue-800/30",
  },
  IN_PROGRESS: {
    light: "bg-purple-100 text-purple-800 border-purple-200",
    dark: "dark:bg-black/40 dark:text-purple-300 dark:border-purple-800/30",
  },
  COMPLETED: {
    light: "bg-green-100 text-green-800 border-green-200",
    dark: "dark:bg-black/40 dark:text-green-300 dark:border-green-800/30",
  },
  CANCELLED: {
    light: "bg-red-100 text-red-800 border-red-200",
    dark: "dark:bg-black/40 dark:text-red-300 dark:border-red-800/30",
  },
}

const paymentMethodIcons = {
  CASH: CreditCardIcon,
  CARD: CreditCardIcon,
  TRANSFER: Receipt,
}

const saleTypeLabels = {
  DIRECT: "Venta Directa",
  PRESALE: "Preventa",
}

const saleTypeIcons = {
  DIRECT: Package,
  PRESALE: CalendarRange,
}

export function SaleDetails({ sale }: { sale: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStatus, setCurrentStatus] = useState(sale.status)
  const [isPending, startTransition] = useTransition()
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentPlan, setPaymentPlan] = useState<any>(null)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setIsLoadingPayments(true)
    try {
      const paymentsResult = await getPaymentsByPurchase(sale.id)
      if (paymentsResult.success) {
        setPayments(paymentsResult.data || [])
      }

      const planResult = await getPaymentPlan(sale.id)
      if (planResult.success) {
        setPaymentPlan(planResult.data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const isValidStatus = (status: string): boolean => {
    return Object.keys(statusLabels).includes(status)
  }

  const handleStatusChange = (newStatus: string) => {
    if (!isValidStatus(newStatus)) {
      toast({
        title: "Error",
        description: "El estado seleccionado no es válido.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await updatePurchaseStatus(sale.id, newStatus)

        if (result.success) {
          setCurrentStatus(newStatus)
          const StatusIcon = statusIcons[newStatus as keyof typeof statusIcons]

          toast({
            title: "Estado actualizado",
            description: `La venta ahora está ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()}`,
            className: cn(
              statusColors[newStatus as keyof typeof statusColors].light,
              statusColors[newStatus as keyof typeof statusColors].dark,
              "border-2",
            ),
          })
        } else {
          throw new Error(result.error || "Error al actualizar el estado")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      }
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const PaymentMethodIcon = paymentMethodIcons[sale.paymentMethod as keyof typeof paymentMethodIcons] || CreditCardIcon
  const SaleTypeIcon = saleTypeIcons[sale.saleType as keyof typeof saleTypeIcons] || Package

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between bg-white dark:bg-black/40 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-gray-100/50 dark:border-gray-800/50"
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
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(statusLabels).map(([value, label]) => {
                const StatusIcon = statusIcons[value as keyof typeof statusIcons]
                const isActive = currentStatus === value

                return (
                  <Button
                    key={value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "gap-2 transition-all duration-300",
                      isActive && statusColors[value as keyof typeof statusColors].light,
                      isActive && statusColors[value as keyof typeof statusColors].dark,
                    )}
                    onClick={() => handleStatusChange(value)}
                    disabled={isPending || isActive}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {label}
                  </Button>
                )
              })}
              {isPending && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Actualizando...</span>
                </div>
              )}
            </div>

            {isPending && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Actualizando...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-black/40 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm border border-gray-100/50 dark:border-gray-800/50"
        >
          {/* Sale Header */}
          <div className="border-b border-gray-100 dark:border-gray-800/50 p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Venta #{sale.id.slice(0, 8)}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {formatDate(sale.purchaseDate)}
                  </div>
                  <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                    <SaleTypeIcon className="h-3.5 w-3.5" />
                    {saleTypeLabels[sale.saleType as keyof typeof saleTypeLabels] || "Venta Directa"}
                  </Badge>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  statusColors[currentStatus as keyof typeof statusColors].light,
                  statusColors[currentStatus as keyof typeof statusColors].dark,
                  "px-6 py-2.5 text-sm font-medium rounded-full border-2",
                  "shadow-sm backdrop-blur-sm",
                )}
              >
                {(() => {
                  const StatusIcon = statusIcons[currentStatus as keyof typeof statusIcons]
                  return (
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      {statusLabels[currentStatus as keyof typeof statusLabels]}
                    </div>
                  )
                })()}
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-16 py-12 bg-gray-50/30 dark:bg-black/20">
            <StatusTimeline currentStatus={currentStatus} />
          </div>

          {/* Client and Payment Info */}
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <User className="h-5 w-5" />
                Información del Cliente
              </div>
              <div className="bg-gray-50/50 dark:bg-black/20 rounded-xl p-6 shadow-lg space-y-4 border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {sale.client?.name || "Cliente no registrado"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sale.client?.document}</p>
                  </div>
                </div>
                {sale.client?.address && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{sale.client.address}</span>
                  </div>
                )}
                {sale.client?.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{sale.client.phone}</span>
                  </div>
                )}
                {sale.client?.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{sale.client.email}</span>
                  </div>
                )}
              </div>

              {sale.organization && (
                <div className="bg-gray-50/50 dark:bg-black/20 rounded-xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm mt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{sale.organization.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sale.organization.type === "SCHOOL"
                          ? "Escuela"
                          : sale.organization.type === "COMPANY"
                            ? "Empresa"
                            : "Organización"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <PaymentMethodIcon className="h-5 w-5" />
                Método de Pago
              </div>
              <div className="bg-gray-50/50 dark:bg-black/20 rounded-xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <PaymentMethodIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <Badge variant="outline" className="text-base px-6 py-2.5 rounded-full shadow-sm backdrop-blur-sm">
                    {sale.paymentMethod === "CASH"
                      ? "Efectivo"
                      : sale.paymentMethod === "CARD"
                        ? "Tarjeta"
                        : sale.paymentMethod === "TRANSFER"
                          ? "Transferencia"
                          : sale.paymentMethod}
                  </Badge>
                </div>
                {sale.transactionReference && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Referencia</span>
                    <Badge variant="outline" className="font-mono">
                      {sale.transactionReference}
                    </Badge>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Estado de pago</span>
                  <Badge
                    variant={sale.isPaid ? "success" : "outline"}
                    className={
                      sale.isPaid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : ""
                    }
                  >
                    {sale.isPaid ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              {sale.saleType === "PRESALE" && !paymentPlan && (
                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl p-6 shadow-lg border border-yellow-100/50 dark:border-yellow-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                      Esta preventa no tiene un plan de pago
                    </p>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                    Crea un plan de pago para gestionar los pagos a plazos de esta venta.
                  </p>
                  <Button
                    onClick={() => setShowPaymentPlanDialog(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    Crear Plan de Pago
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Products */}
          <motion.div variants={itemVariants} className="p-8 space-y-6 bg-gray-50/30 dark:bg-black/20">
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
                      hoveredItem === index && "scale-[1.02] shadow-xl",
                    )}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.inventoryItem?.name || "Producto eliminado"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
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
                          SKU: {item.inventoryItem?.sku || "N/A"}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Payments Section */}
          {(payments.length > 0 || sale.saleType === "PRESALE") && (
            <motion.div
              variants={itemVariants}
              className="p-8 space-y-6 border-t border-gray-100 dark:border-gray-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <CreditCardIcon className="h-5 w-5" />
                  Pagos
                </div>
                {paymentPlan && (
                  <Badge variant="outline" className="px-3 py-1.5">
                    Plan: {paymentPlan.installmentCount} cuotas{" "}
                    {paymentPlan.installmentFrequency === "WEEKLY"
                      ? "semanales"
                      : paymentPlan.installmentFrequency === "BIWEEKLY"
                        ? "quincenales"
                        : "mensuales"}
                  </Badge>
                )}
              </div>

              {isLoadingPayments ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <PaymentsTable payments={payments} onPaymentUpdated={fetchPayments} />
              )}

              {sale.saleType === "PRESALE" && !paymentPlan && (
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setShowPaymentPlanDialog(true)} className="gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Crear Plan de Pago
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Total */}
          <motion.div
            variants={itemVariants}
            className="p-8 bg-gradient-to-b from-white to-gray-50 dark:from-black/40 dark:to-black/60 border-t border-gray-100 dark:border-gray-800/50"
          >
            <div className="flex justify-end items-center">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total de la venta</p>
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Payment Plan Dialog */}
      <PaymentPlanDialog
        open={showPaymentPlanDialog}
        onOpenChange={setShowPaymentPlanDialog}
        purchaseId={sale.id}
        totalAmount={Number.parseFloat(sale.totalAmount)}
        onSuccess={fetchPayments}
      />
    </div>
  )
}

