"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addPartialPayment, getRemainingBalance } from "@/features/sales/views/payment-actions"
import { formatCurrency } from "@/lib/utils"
import { getBCVRate } from "@/lib/exchangeRates"
import { Loader2, DollarSign, CreditCard, AlertCircle, RefreshCw, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PartialPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string
  onSuccess?: () => void
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  purchaseId,
  onSuccess,
}: PartialPaymentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [loadingBCV, setLoadingBCV] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [currencyType, setCurrencyType] = useState("USD")
  const [conversionRate, setConversionRate] = useState("1")
  const [transactionReference, setTransactionReference] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [remainingBalance, setRemainingBalance] = useState<{
    totalAmount: number
    totalPaid: number
    remainingAmount: number
    isPaid: boolean
    currencyType: string
    conversionRate: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRemainingBalance = async () => {
    if (!purchaseId) return

    try {
      setLoadingBalance(true)
      setError(null)
      const result = await getRemainingBalance(purchaseId)
      
      if (result?.success && result.data) {
        const data = {
          totalAmount: Number(result.data.totalAmount),
          totalPaid: Number(result.data.totalPaid || 0),
          remainingAmount: Number(result.data.remainingAmount),
          isPaid: Boolean(result.data.isPaid),
          currencyType: String(result.data.currencyType || "USD"),
          conversionRate: Number(result.data.conversionRate || 1),
        }

        setRemainingBalance(data)
        setCurrencyType(data.currencyType)
        if (data.currencyType === "BS") setConversionRate("1")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al obtener el saldo"
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoadingBalance(false)
    }
  }

  const fetchBCVRate = async () => {
    try {
      setLoadingBCV(true)
      const rateInfo = await getBCVRate()
      setConversionRate(rateInfo.rate.toString())
    } catch (error) {
      toast({ title: "Error", description: "No se pudo obtener la tasa BCV", variant: "destructive" })
    } finally {
      setLoadingBCV(false)
    }
  }

  useEffect(() => {
    if (open && purchaseId) fetchRemainingBalance()
  }, [open, purchaseId])

  useEffect(() => {
    if (currencyType === "BS" && remainingBalance?.currencyType === "USD") {
      fetchBCVRate()
    }
  }, [currencyType])

  const handleSubmit = async () => {
    try {
      if (!amount || Number(amount) <= 0) throw new Error("El monto debe ser mayor a cero")
      setLoading(true)

      let originalAmount = Number(amount)
      
      // Solo convertir si la venta está en USD y el pago es en BS
      if (remainingBalance?.currencyType === "USD" && currencyType === "BS") {
        originalAmount = Number(amount) / Number(conversionRate)
      }

      await addPartialPayment({
        purchaseId,
        amount: Number(amount),
        paymentMethod,
        currencyType,
        conversionRate: Number(conversionRate),
        transactionReference: transactionReference || undefined,
        notes: notes || undefined,
        originalAmount,
        paymentDate,
      })

      toast({
        title: "Pago registrado",
        description: `Abono de ${formatCurrency(amount)} ${currencyType} registrado`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })

      onOpenChange(false)
      onSuccess?.()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Registrar Abono
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-1 py-2 flex-1 space-y-4">
          {loadingBalance ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : remainingBalance ? (
            <>
              <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Moneda</div>
                    <div className="text-base font-semibold">
                      {remainingBalance.currencyType}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Saldo pendiente</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(remainingBalance.remainingAmount)} {remainingBalance.currencyType}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha de pago</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(paymentDate, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={paymentDate}
                        onSelect={(date) => date && setPaymentDate(date)}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {remainingBalance.currencyType === "USD" && (
                  <div className="space-y-2">
                    <Label>Moneda de Pago</Label>
                    <Select value={currencyType} onValueChange={setCurrencyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BS">BS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {remainingBalance.currencyType === "BS"
                      ? "Monto en Bs"
                      : `Monto en ${currencyType}`}
                  </Label>
                  <div className="relative">
                    {currencyType === "BS" && (
                      <span className="absolute left-3 top-2.5 text-muted-foreground">Bs.</span>
                    )}
                    {currencyType === "USD" && (
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={currencyType === "BS" ? "pl-9" : "pl-9"}
                    />
                  </div>
                </div>

                {remainingBalance.currencyType === "USD" && currencyType === "BS" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Tasa: {conversionRate} Bs/USD</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchBCVRate}
                        disabled={loadingBCV}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingBCV ? "animate-spin" : ""}`} />
                        Actualizar tasa
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="Número de referencia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Información adicional"
                  />
                </div>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !remainingBalance}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Registrando..." : "Registrar Abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}