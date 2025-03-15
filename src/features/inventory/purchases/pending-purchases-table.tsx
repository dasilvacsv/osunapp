"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPendingPurchases, getPurchaseDetails } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  FileText,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  Package,
} from "lucide-react"
import { PurchasePaymentDialog } from "./purchase-payment-dialog"
import type { Purchase, PurchasePayment } from "../types"

export function PendingPurchasesTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, any>>({})
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({})
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const { toast } = useToast()

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const result = await getPendingPurchases()
      if (result.success && result.data) {
        setPurchases(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las compras pendientes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching pending purchases:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar las compras pendientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseDetails = async (purchaseId: string) => {
    if (purchaseDetails[purchaseId]) return

    try {
      setDetailsLoading((prev) => ({ ...prev, [purchaseId]: true }))
      const result = await getPurchaseDetails(purchaseId)
      if (result.success && result.data) {
        setPurchaseDetails((prev) => ({ ...prev, [purchaseId]: result.data }))
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la compra",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los detalles de la compra",
        variant: "destructive",
      })
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [purchaseId]: false }))
    }
  }

  const toggleExpand = (purchaseId: string) => {
    const newExpanded = { ...expanded, [purchaseId]: !expanded[purchaseId] }
    setExpanded(newExpanded)

    if (newExpanded[purchaseId] && !purchaseDetails[purchaseId]) {
      fetchPurchaseDetails(purchaseId)
    }
  }

  const handleOpenPaymentDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsPaymentDialogOpen(true)
  }

  const handlePaymentRegistered = () => {
    fetchPurchases()
    // Limpiar los detalles para que se recarguen
    setPurchaseDetails({})
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No hay compras pendientes</h3>
          <p className="text-muted-foreground">Todas las compras a crédito han sido pagadas completamente.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Compras a Crédito Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {purchases.map((purchase) => {
                  const pendingAmount = Number(purchase.totalAmount) - Number(purchase.paidAmount)
                  const isPastDue = purchase.dueDate && new Date(purchase.dueDate) < new Date()

                  return (
                    <>
                      <motion.tr
                        key={purchase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`relative group hover:bg-muted/50 ${
                          isPastDue ? "bg-red-50/30 dark:bg-red-900/10" : ""
                        }`}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(purchase.id)}
                            className="transition-transform group-hover:scale-110"
                          >
                            {expanded[purchase.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                        <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                        <TableCell>
                          {purchase.dueDate ? (
                            <div className="flex items-center gap-1">
                              {isPastDue && <AlertCircle className="h-4 w-4 text-destructive" />}
                              {formatDate(purchase.dueDate)}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.status === "PAID"
                                ? "default"
                                : purchase.status === "PARTIAL"
                                  ? "outline"
                                  : "secondary"
                            }
                            className={
                              purchase.status === "PARTIAL"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : purchase.status === "PENDING"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : ""
                            }
                          >
                            {purchase.status === "PAID"
                              ? "Pagado"
                              : purchase.status === "PARTIAL"
                                ? "Pago Parcial"
                                : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(purchase.totalAmount))}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(pendingAmount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPaymentDialog(purchase)}
                            className="w-full"
                          >
                            <DollarSign className="h-4 w-4 mr-1" /> Pagar
                          </Button>
                        </TableCell>
                      </motion.tr>
                      {expanded[purchase.id] && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TableCell colSpan={9}>
                            <motion.div
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="p-4 bg-muted/30 rounded-lg"
                            >
                              {detailsLoading[purchase.id] ? (
                                <div className="flex items-center justify-center p-4">
                                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : purchaseDetails[purchase.id] ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Productos</h4>
                                      <div className="bg-background rounded-md border overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Producto</TableHead>
                                              <TableHead className="text-right">Cantidad</TableHead>
                                              <TableHead className="text-right">Costo</TableHead>
                                              <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {purchaseDetails[purchase.id].items.map((item: any, index: number) => (
                                              <TableRow key={index}>
                                                <TableCell className="flex items-center gap-2">
                                                  <Package className="h-4 w-4 text-muted-foreground" />
                                                  {item.item.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {item.purchaseItem.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(Number(item.purchaseItem.unitCost))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                  {formatCurrency(Number(item.purchaseItem.totalCost))}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Historial de Pagos</h4>
                                      {purchaseDetails[purchase.id].payments.length > 0 ? (
                                        <div className="bg-background rounded-md border overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Método</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {purchaseDetails[purchase.id].payments.map((payment: PurchasePayment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                                  <TableCell>
                                                    {payment.paymentMethod === "CASH"
                                                      ? "Efectivo"
                                                      : payment.paymentMethod === "TRANSFER"
                                                        ? "Transferencia"
                                                        : payment.paymentMethod === "CHECK"
                                                          ? "Cheque"
                                                          : "Otro"}
                                                  </TableCell>
                                                  <TableCell className="text-right font-medium">
                                                    {formatCurrency(Number(payment.amount))}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center p-4 bg-background rounded-md border">
                                          <p className="text-muted-foreground">No hay pagos registrados</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {purchase.notes && (
                                    <div className="p-3 bg-background rounded-md border">
                                      <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Notas
                                      </h4>
                                      <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center p-4">
                                  <p className="text-muted-foreground">No se pudieron cargar los detalles</p>
                                </div>
                              )}
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPurchase && (
        <PurchasePaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          purchaseId={selectedPurchase.id}
          totalAmount={Number(selectedPurchase.totalAmount)}
          paidAmount={Number(selectedPurchase.paidAmount)}
          onPaymentRegistered={handlePaymentRegistered}
        />
      )}
    </div>
  )
}

