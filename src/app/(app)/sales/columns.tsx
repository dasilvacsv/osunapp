"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  FileText,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CalendarRange,
  Package2,
  CreditCard,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { PaymentPlanDialog } from "@/features/sales/payment-plan-dialog"

export type Sale = {
  id: string
  client: {
    name: string
    id: string
  }
  organization?: {
    id: string
    name: string
  }
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  totalAmount: number
  paymentMethod: string
  purchaseDate: Date
  transactionReference?: string
  saleType: "DIRECT" | "PRESALE"
  isPaid: boolean
  paymentPlan?: {
    id: string
    installmentCount: number
    installmentFrequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  }
}

const StatusIcon = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Clock,
  APPROVED: CheckCircle2,
  PENDING: Clock,
  CANCELLED: XCircle,
}

const StatusColors = {
  COMPLETED: "text-green-500 dark:text-green-400",
  IN_PROGRESS: "text-blue-500 dark:text-blue-400",
  APPROVED: "text-blue-500 dark:text-blue-400",
  PENDING: "text-yellow-500 dark:text-yellow-400",
  CANCELLED: "text-red-500 dark:text-red-400",
}

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const id = row.original.id
      if (!id) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>ID no disponible</span>
          </div>
        )
      }
      return (
        <Link
          href={`/sales/${id}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="font-mono">#{id.slice(0, 8).toUpperCase()}</span>
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </Link>
      )
    },
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const clientName = row.original.client?.name
      const clientId = row.original.client?.id
      if (!clientName) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Cliente no disponible</span>
          </div>
        )
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="font-medium text-foreground hover:text-foreground/80 transition-colors cursor-help">
                {clientName}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>ID: {clientId || "No disponible"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "organization",
    header: "Organización",
    cell: ({ row }) => {
      const organization = row.original?.organization

      if (!organization) {
        return <span className="text-muted-foreground text-sm">-</span>
      }

      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{organization.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "saleType",
    header: "Tipo",
    cell: ({ row }) => {
      const saleType = row.getValue("saleType") as string

      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 ${
            saleType === "PRESALE" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : ""
          }`}
        >
          {saleType === "DIRECT" ? (
            <>
              <Package2 className="h-3 w-3" />
              <span>Directa</span>
            </>
          ) : (
            <>
              <CalendarRange className="h-3 w-3" />
              <span>Preventa</span>
            </>
          )}
        </Badge>
      )
    },
  },
  {
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const rawDate = row.original.purchaseDate
      if (!rawDate) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Fecha no disponible</span>
          </div>
        )
      }
      const date = new Date(rawDate)
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-muted-foreground hover:text-foreground transition-colors cursor-help">
                {formatDate(date)}
              </div>
            </TooltipTrigger>
            <TooltipContent>{date.toLocaleString()}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      if (!row || typeof row.getValue !== "function") {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Total no disponible</span>
          </div>
        )
      }

      const amount = row.getValue("totalAmount")
      return formatCurrency(amount)
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const status = row.original.status
      if (!status) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Estado no disponible</span>
          </div>
        )
      }
      const StatusIconComponent = StatusIcon[status] || AlertCircle
      const statusColor = StatusColors[status] || "text-muted-foreground"
      const variants = {
        COMPLETED: "success",
        IN_PROGRESS: "default",
        APPROVED: "default",
        PENDING: "warning",
        CANCELLED: "destructive",
      } as const
      const labels = {
        COMPLETED: "Completado",
        IN_PROGRESS: "En Proceso",
        APPROVED: "Aprobado",
        PENDING: "Pendiente",
        CANCELLED: "Cancelado",
      }
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="flex items-center gap-2"
        >
          <StatusIconComponent className={`w-4 h-4 ${statusColor}`} />
          <Badge variant={variants[status] || "outline"} className="capitalize transition-all hover:scale-105">
            {labels[status as keyof typeof labels] || status.toLowerCase()}
          </Badge>
        </motion.div>
      )
    },
  },
  {
    accessorKey: "isPaid",
    header: "Pago",
    cell: ({ row }) => {
      const isPaid = row.getValue("isPaid") as boolean

      return (
        <Badge
          variant={isPaid ? "success" : "outline"}
          className={isPaid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : ""}
        >
          {isPaid ? "Pagado" : "Pendiente"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pago",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const method = row.original.paymentMethod
      if (!method) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Método no disponible</span>
          </div>
        )
      }
      const labels = {
        CASH: "Efectivo",
        CARD: "Tarjeta",
        TRANSFER: "Transferencia",
        CREDIT: "Crédito",
        DEBIT: "Débito",
      }
      const icons = {
        CASH: "💵",
        CARD: "💳",
        TRANSFER: "🏦",
        CREDIT: "📈",
        DEBIT: "📉",
      }
      return (
        <Badge variant="outline" className="capitalize transition-all hover:bg-accent flex items-center gap-2">
          <span>{icons[method as keyof typeof icons] || "💸"}</span>
          {labels[method as keyof typeof labels] || method.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      const [isDialogOpen, setIsDialogOpen] = useState(false)

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => (window.location.href = `/sales/${sale.id}`)}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {!sale.isPaid && !sale.paymentPlan && (
                <DropdownMenuItem
                  onClick={() => setIsDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Crear plan de pago
                </DropdownMenuItem>
              )}

              {sale.paymentPlan && (
                <DropdownMenuItem
                  onClick={() => {
                    // Handle viewing payments
                    console.log("View payments for sale", sale.id)
                  }}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ver pagos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <PaymentPlanDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            purchaseId={sale.id}
            totalAmount={sale.totalAmount}
            onSuccess={() => {
              setIsDialogOpen(false)
              // Aquí puedes agregar lógica adicional de actualización si es necesario
            }}
          />
        </>
      )
    },
  },
]