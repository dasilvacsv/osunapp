"use client"

import { useState, useEffect } from "react"
import type { Payment, PaymentTransaction } from "./payment-types"
import {
  getClientPayments,
  getPaymentTransactions,
  sendPaymentConfirmation,
} from "@/app/(app)/clientes/payment-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentTransactionForm } from "./payment-transaction-form"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CreditCard, DollarSign, Plus, RefreshCw, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

interface PaymentListProps {
  clientId: string
}

export function PaymentList({ clientId }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<Record<string, PaymentTransaction[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [isSendingConfirmation, setIsSendingConfirmation] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const result = await getClientPayments(clientId)
      if (result.success) {
        setPayments(result.data)

        // Load transactions for each payment
        const txMap: Record<string, PaymentTransaction[]> = {}
        for (const payment of result.data) {
          const txResult = await getPaymentTransactions(payment.id)
          if (txResult.success) {
            txMap[payment.id] = txResult.data
          }
        }
        setTransactions(txMap)
      }
    } catch (error) {
      console.error("Error loading payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [clientId])

  const handleAddTransaction = (paymentId: string) => {
    setSelectedPayment(paymentId)
    setShowTransactionDialog(true)
  }

  const handleTransactionSuccess = () => {
    loadPayments()
  }

  const handleSendConfirmation = async (paymentId: string) => {
    setIsSendingConfirmation((prev) => ({ ...prev, [paymentId]: true }))
    try {
      const result = await sendPaymentConfirmation(paymentId)
      if (result.success) {
        toast({
          title: "Confirmación enviada",
          description: "El mensaje de confirmación ha sido enviado correctamente",
        })

        // In a real implementation, you would actually send the message
        // For now, we'll just show what would be sent
        console.log("Message content:", result.data?.message)
        console.log(
          "Would send to:",
          result.data?.clientWhatsapp || result.data?.clientPhone || result.data?.clientEmail,
        )
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar la confirmación",
      })
    } finally {
      setIsSendingConfirmation((prev) => ({ ...prev, [paymentId]: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-600">Pagado</Badge>
      case "PARTIAL":
        return <Badge className="bg-blue-100 text-blue-600">Parcial</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-600">Pendiente</Badge>
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-600">Vencido</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading && payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>Cargando información de pagos...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>Este cliente no tiene pagos registrados</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">No hay pagos para mostrar</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <CardDescription>Gestione los pagos y transacciones del cliente</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-4">
          {payments.map((payment) => (
            <AccordionItem key={payment.id} value={payment.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50 rounded-t-lg">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full p-2 bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{payment.description || `Pago #${payment.id.substring(0, 8)}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.date), "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(payment.status)}
                    <p className="font-semibold">${Number(payment.amount).toFixed(2)}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Transacciones</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendConfirmation(payment.id)}
                        disabled={isSendingConfirmation[payment.id]}
                      >
                        {isSendingConfirmation[payment.id] ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Enviar Confirmación
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddTransaction(payment.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Abono
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {transactions[payment.id]?.length > 0 ? (
                    <div className="space-y-3">
                      {transactions[payment.id].map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {tx.method === "CASH" && <DollarSign className="h-4 w-4 text-green-600" />}
                            {tx.method === "TRANSFER" && <CreditCard className="h-4 w-4 text-blue-600" />}
                            {tx.method === "CARD" && <CreditCard className="h-4 w-4 text-purple-600" />}
                            <div>
                              <p className="text-sm font-medium">
                                {tx.method === "CASH"
                                  ? "Efectivo"
                                  : tx.method === "TRANSFER"
                                    ? "Transferencia"
                                    : tx.method === "CARD"
                                      ? "Tarjeta"
                                      : "Otro"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.date), "PPP", { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(tx.amount).toFixed(2)}</p>
                            {tx.reference && <p className="text-xs text-muted-foreground">Ref: {tx.reference}</p>}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">Total Pagado</p>
                        </div>
                        <p className="font-semibold">
                          ${transactions[payment.id].reduce((sum, tx) => sum + Number(tx.amount), 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">Saldo Pendiente</p>
                        </div>
                        <p className="font-semibold">
                          $
                          {(
                            Number(payment.amount) -
                            transactions[payment.id].reduce((sum, tx) => sum + Number(tx.amount), 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No hay transacciones registradas</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>

      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <PaymentTransactionForm
              paymentId={selectedPayment}
              closeDialog={() => setShowTransactionDialog(false)}
              onSuccess={handleTransactionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

