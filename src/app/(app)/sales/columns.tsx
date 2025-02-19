import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"

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
        className="text-primary hover:underline"
      >
        #{row.getValue("id").slice(0, 8)}
      </Link>
    )
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
  },
  {
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => formatDate(row.getValue("purchaseDate")),
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.getValue("totalAmount")),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Badge 
          variant={
            row.getValue("status") === 'COMPLETED' ? 'default' :
            row.getValue("status") === 'IN_PROGRESS' ? 'secondary' :
            row.getValue("status") === 'APPROVED' ? 'outline' :
            'destructive'
          }
          className="capitalize"
        >
          {row.getValue("status").toLowerCase().replace('_', ' ')}
        </Badge>
      </motion.div>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pago",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod")
      return (
        <Badge variant="outline" className="capitalize">
          {method.toLowerCase()}
        </Badge>
      )
    }
  }
]