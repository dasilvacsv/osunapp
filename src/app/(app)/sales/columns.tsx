import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import { FileText, ArrowRight } from "lucide-react"

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

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => (
      <Link 
        href={`/sales/${row.original.id}`}
        className="group flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200"
      >
        <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span>#{row.getValue("id").slice(0, 8)}</span>
        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>
    )
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="font-medium dark:text-gray-200">
        {row.getValue("client.name")}
      </div>
    )
  },
  {
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatDate(row.getValue("purchaseDate"))}
      </div>
    )
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-semibold tabular-nums">
        {formatCurrency(row.getValue("totalAmount"))}
      </div>
    )
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants = {
        COMPLETED: "default",
        IN_PROGRESS: "secondary",
        APPROVED: "outline",
        PENDING: "secondary",
        CANCELLED: "destructive"
      } as const

      const labels = {
        COMPLETED: "Completado",
        IN_PROGRESS: "En Proceso",
        APPROVED: "Aprobado",
        PENDING: "Pendiente",
        CANCELLED: "Cancelado"
      }

      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <Badge 
            variant={variants[status as keyof typeof variants]}
            className="capitalize transition-all hover:scale-105"
          >
            {labels[status as keyof typeof labels]}
          </Badge>
        </motion.div>
      )
    }
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pago",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as string
      const labels = {
        CASH: "Efectivo",
        CARD: "Tarjeta",
        TRANSFER: "Transferencia"
      }

      return (
        <Badge 
          variant="outline" 
          className="capitalize transition-all hover:bg-accent"
        >
          {labels[method as keyof typeof labels] || method.toLowerCase()}
        </Badge>
      )
    }
  }
]