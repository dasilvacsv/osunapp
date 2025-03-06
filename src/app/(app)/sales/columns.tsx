"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import { FileText, ArrowRight, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react"

export type Sale = {
  id: string
  client: {
    name: string
    id: string
  }
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"
  totalAmount: number
  paymentMethod: string
  purchaseDate: Date
  transactionReference?: string
}

const StatusIcon = {
  COMPLETED: CheckCircle2,
  PROCESSING: Clock,
  PENDING: Clock,
  CANCELLED: XCircle,
}

const StatusColors = {
  COMPLETED: "text-green-500 dark:text-green-400",
  PROCESSING: "text-blue-500 dark:text-blue-400",
  PENDING: "text-yellow-500 dark:text-yellow-400",
  CANCELLED: "text-red-500 dark:text-red-400",
}

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => {
      // Verificar que row.original existe antes de acceder a sus propiedades
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
      // Verificar que row.original existe
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
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => {
      // Verificar que row.original existe
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
      // Verificar que row existe y getValue es una función
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
      // Verificar que row.original existe
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
        PROCESSING: "default",
        PENDING: "warning",
        CANCELLED: "destructive",
      } as const
      const labels = {
        COMPLETED: "Completado",
        PROCESSING: "En Proceso",
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
    accessorKey: "paymentMethod",
    header: "Método de Pago",
    cell: ({ row }) => {
      // Verificar que row.original existe
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
]

