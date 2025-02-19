'use client'

import { motion, AnimatePresence } from "framer-motion"
import { InventoryTransaction } from "./types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle, Clock, Package } from "lucide-react"

interface TransactionHistoryProps {
  transactions: InventoryTransaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-green-500">
            <ArrowUpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Entradas Totales</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {transactions.filter(t => t.transactionType === 'IN').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-red-500">
            <ArrowDownCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Salidas Totales</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {transactions.filter(t => t.transactionType === 'OUT').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-blue-500">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Última Transacción</span>
          </div>
          <p className="text-sm font-medium mt-2">
            {formatDate(transactions[0]?.createdAt || new Date())}
          </p>
        </motion.div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {transactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.transactionType === 'IN' ? 'success' :
                          transaction.transactionType === 'OUT' ? 'destructive' : 'default'
                      }
                      className="flex w-fit items-center gap-1"
                    >
                      {transaction.transactionType === 'IN' ? (
                        <ArrowUpCircle className="h-3 w-3" />
                      ) : transaction.transactionType === 'OUT' ? (
                        <ArrowDownCircle className="h-3 w-3" />
                      ) : (
                        <Package className="h-3 w-3" />
                      )}
                      {transaction.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.notes || '-'}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}