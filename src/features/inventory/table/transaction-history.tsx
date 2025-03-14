"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { InventoryTransaction } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle, Package, AlertTriangle, Flag } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getInventoryItem } from "../actions"

interface TransactionHistoryProps {
  transactions: InventoryTransaction[]
  itemId: string
}

export function TransactionHistory({ transactions, itemId }: TransactionHistoryProps) {
  const [initialStock, setInitialStock] = useState<number | null>(null)
  const [reservedStock, setReservedStock] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true)
        const result = await getInventoryItem(itemId)
        if (result.success && result.data) {
          setInitialStock(result.data.currentStock)
          setReservedStock(result.data.reservedStock)
        } else {
          setError("No se pudo obtener la información del producto")
        }
      } catch (err) {
        setError("Error al cargar los detalles del producto")
        console.error("Error fetching item details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchItemDetails()
  }, [itemId])

  // Calcular estadísticas de transacciones
  const inTransactions = transactions.filter((t) => t.transactionType === "IN")
  const outTransactions = transactions.filter((t) => t.transactionType === "OUT")
  const reservationTransactions = transactions.filter((t) => t.transactionType === "RESERVATION")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">Stock Actual</span>
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold mt-2">{initialStock !== null ? initialStock : "N/A"}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-red-500">
            <Flag className="h-5 w-5" />
            <span className="text-sm font-medium">Stock Reservado</span>
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold mt-2">{reservedStock !== null ? reservedStock : "0"}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-green-500">
            <ArrowUpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Entradas</span>
          </div>
          <p className="text-2xl font-bold mt-2">{inTransactions.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-muted/30"
        >
          <div className="flex items-center gap-2 text-red-500">
            <ArrowDownCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Salidas</span>
          </div>
          <p className="text-2xl font-bold mt-2">{outTransactions.length + reservationTransactions.length}</p>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-4 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </motion.div>
      )}

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
                  <TableCell className="font-medium">{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.transactionType === "IN"
                          ? "secondary"
                          : transaction.transactionType === "OUT"
                            ? "destructive"
                            : transaction.transactionType === "RESERVATION"
                              ? "outline"
                              : "default"
                      }
                      className={`flex w-fit items-center gap-1 ${
                        transaction.transactionType === "RESERVATION"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300"
                          : ""
                      }`}
                    >
                      {transaction.transactionType === "IN" ? (
                        <ArrowUpCircle className="h-3 w-3" />
                      ) : transaction.transactionType === "OUT" ? (
                        <ArrowDownCircle className="h-3 w-3" />
                      ) : transaction.transactionType === "RESERVATION" ? (
                        <Flag className="h-3 w-3" />
                      ) : (
                        <Package className="h-3 w-3" />
                      )}
                      {transaction.transactionType === "IN"
                        ? "ENTRADA"
                        : transaction.transactionType === "OUT"
                          ? "SALIDA"
                          : transaction.transactionType === "RESERVATION"
                            ? "RESERVA"
                            : transaction.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.notes?.includes("Venta") || transaction.notes?.includes("Pre-venta") ? (
                      <Link
                        href={`/sales/${transaction.notes.split("#").pop()}`}
                        className="text-blue-500 hover:underline"
                      >
                        {transaction.notes}
                      </Link>
                    ) : (
                      transaction.notes || "-"
                    )}
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

