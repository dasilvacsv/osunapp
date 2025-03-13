"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CreditCard, CheckCircle, Clock, AlertCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { recordPayment, updatePaymentStatus, getPaymentsByPurchase } from "@/features/sales/views/payment-actions"
import { useToast } from "@/hooks/use-toast"  
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Payment {
  id: string
  purchaseId: string
  amount: string
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  paymentDate: Date | null
  dueDate: Date | null
  paymentMethod: string | null
  transactionReference: string | null
  notes: string | null
}

interface PaymentTableProps {
  purchaseId: string
  refreshTrigger?: number
  onPaymentUpdated?: () => void
}

export function PaymentTable({ purchaseId, refreshTrigger = 0, onPaymentUpdated }: PaymentTableProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [transactionReference, setTransactionReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [purchaseId, refreshTrigger])

  const fetchPayments = async () => {
    setIsLoading(true)
    try {
      const result = await getPaymentsByPurchase(purchaseId)
      if (result.success) {
        setPayments(result.data || [])
      } else {
        console.error("Error fetching payments:", result.error)
        setPayments([])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedPayment) return

    try {
      setLoading(true)
      const result = await recordPayment({
        paymentId: selectedPayment.id,
        paymentMethod,
        transactionReference: transactionReference || undefined,
        notes: paymentNotes || undefined,
      })

      if (result.success) {
        toast({
          title: "Pago registrado",
          description: `Se ha registrado el pago de ${formatCurrency(Number.parseFloat(selectedPayment.amount))}`,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        fetchPayments()
        setShowPaymentDialog(false)
        if (onPaymentUpdated) {
          onPaymentUpdated();
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (paymentId: string, status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED") => {
    try {
      setLoading(true)
      const result = await updatePaymentStatus(paymentId, status)

      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: `Se ha actualizado el estado del pago`,
          className: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
        })
        fetchPayments()
        if (onPaymentUpdated) {
          onPaymentUpdated();
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Pagado
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </Badge>
        )
      case "OVERDUE":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Vencido
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>No hay pagos registrados para esta venta</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Button variant="outline" onClick={fetchPayments} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagos
            </span>
            <Button variant="outline" size="sm" onClick={fetchPayments} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </CardTitle>
          <CardDescription>Gestiona los pagos asociados a esta venta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.notes || "Pago"}</TableCell>
                    <TableCell>{formatCurrency(Number.parseFloat(payment.amount))}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.dueDate ? formatDate(payment.dueDate) : "-"}</TableCell>
                    <TableCell>{payment.paymentDate ? formatDate(payment.paymentDate) : "-"}</TableCell>
                    <TableCell>{payment.paymentMethod || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payment.status === "PENDING" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setShowPaymentDialog(true)
                              }}
                              disabled={loading}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Registrar Pago
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(payment.id, "OVERDUE")}
                              disabled={loading}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Marcar Vencido
                            </Button>
                          </>
                        )}
                        {payment.status === "OVERDUE" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowPaymentDialog(true)
                            }}
                            disabled={loading}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Registrar Pago
                          </Button>
                        )}
                        {payment.status === "PENDING" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUpdateStatus(payment.id, "CANCELLED")}
                            disabled={loading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Registrar Pago
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedPayment && (
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground">Monto a pagar</div>
                <div className="text-2xl font-bold mt-1">
                  {formatCurrency(Number.parseFloat(selectedPayment.amount))}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Fecha de vencimiento:{" "}
                  {selectedPayment.dueDate ? formatDate(selectedPayment.dueDate) : "No especificada"}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CARD">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionReference">Referencia de transacción (opcional)</Label>
                <Input
                  id="transactionReference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Número de referencia, recibo, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notas (opcional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Información adicional sobre el pago"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleRecordPayment} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {loading ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

