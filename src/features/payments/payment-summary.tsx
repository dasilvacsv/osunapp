"use client"

import { useState, useEffect } from "react"
import type { PaymentSummary as PaymentSummaryType } from "./payment-types"
import { getClientPaymentSummary } from "@/app/(app)/clientes/payment-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertCircle, CalendarDays, CheckCircle2, Clock, DollarSign, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentForm } from "./payment-form"

interface PaymentSummaryProps {
  clientId: string
}

export function PaymentSummary({ clientId }: PaymentSummaryProps) {
  const [summary, setSummary] = useState<PaymentSummaryType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const loadSummary = async () => {
    setIsLoading(true)
    try {
      const result = await getClientPaymentSummary(clientId)
      if (result.success && result.data) {
        setSummary(result.data)
      }
    } catch (error) {
      console.error("Error loading payment summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [clientId])

  const handlePaymentSuccess = () => {
    loadSummary()
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Pagos</CardTitle>
          <CardDescription>Cargando información...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Pagos</CardTitle>
          <CardDescription>No hay información disponible</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No se pudo cargar la información de pagos
        </CardContent>
      </Card>
    )
  }

  const paymentProgress = summary.totalAmount > 0 ? (summary.paidAmount / summary.totalAmount) * 100 : 100

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Resumen de Pagos</CardTitle>
          <CardDescription>Estado de cuenta del cliente</CardDescription>
        </div>
        <Button onClick={() => setShowPaymentDialog(true)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Nuevo Pago
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-2xl font-bold">${summary.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm text-muted-foreground">Total Pagado</p>
              <p className="text-2xl font-bold">${summary.paidAmount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <AlertCircle
                className={`h-8 w-8 mb-2 ${summary.remainingBalance > 0 ? "text-red-600" : "text-green-600"}`}
              />
              <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
              <p className="text-2xl font-bold">${summary.remainingBalance.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm">Progreso de Pago</p>
            <p className="text-sm font-medium">{Math.round(paymentProgress)}%</p>
          </div>
          <Progress value={paymentProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Último Pago</p>
                <p className="text-xs text-muted-foreground">
                  {summary.lastPaymentDate
                    ? format(new Date(summary.lastPaymentDate), "PPP", { locale: es })
                    : "Sin pagos registrados"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Estado de Cuenta</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(summary.status)}
                  {summary.isOverdue && (
                    <p className="text-xs text-red-600">{summary.daysSinceLastPayment} días desde el último pago</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Pago</DialogTitle>
          </DialogHeader>
          <PaymentForm
            clientId={clientId}
            closeDialog={() => setShowPaymentDialog(false)}
            onSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

