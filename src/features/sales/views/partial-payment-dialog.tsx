"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  initialCurrency?: string
  initialAmount?: string
  initialConvertedAmount?: string
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  purchaseId,
  onSuccess,
  initialCurrency,
  initialAmount,
  initialConvertedAmount,
}: PartialPaymentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [loadingBCV, setLoadingBCV] = useState(false)
  const [amount, setAmount] = useState(initialAmount || "")
  const [bsAmount, setBsAmount] = useState(initialConvertedAmount || "")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [currencyType, setCurrencyType] = useState(initialCurrency || "USD")
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
    if (!purchaseId) {
      console.error("No purchaseId provided")
      setError("ID de venta no proporcionado")
      return
    }

    console.log("Fetching balance for purchaseId:", purchaseId)
    try {
      setLoadingBalance(true)
      setError(null)

      const result = await getRemainingBalance(purchaseId)
      console.log("Balance result:", result)

      if (!result) {
        throw new Error("No se pudo obtener el saldo")
      }

      if (result.success && result.data) {
        const data = {
          totalAmount: Number(result.data.totalAmount),
          totalPaid: Number(result.data.totalPaid || 0),
          remainingAmount: Number(result.data.remainingAmount),
          isPaid: Boolean(result.data.isPaid),
          currencyType: String(result.data.currencyType || "USD"),
          conversionRate: Number(result.data.conversionRate || 1),
        }

        console.log("Processed balance data:", data)
        setRemainingBalance(data)

        // Only set currency type if not already set from props
        if (!initialCurrency) {
          setCurrencyType(data.currencyType)
        }

        setConversionRate(data.conversionRate.toString())
      } else {
        throw new Error(result.error || "Error al obtener el saldo")
      }
    } catch (error) {
      console.error("Error in fetchRemainingBalance:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al obtener el saldo pendiente"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  // Update the fetchBCVRate function to use your existing implementation
  const fetchBCVRate = async () => {
    try {
      setLoadingBCV(true)
      const rateInfo = await getBCVRate()
      setConversionRate(rateInfo.rate.toString())

      // Update amounts based on new rate
      if (currencyType === "BS" && amount) {
        const bsValue = (Number(amount) * rateInfo.rate).toFixed(2)
        setBsAmount(bsValue)
      } else if (currencyType === "BS" && bsAmount) {
        const usdValue = (Number(bsAmount) / rateInfo.rate).toFixed(2)
        setAmount(usdValue)
      }

      toast({
        title: "Tasa BCV actualizada",
        description: `Tasa actual: ${rateInfo.rate} Bs/USD (${rateInfo.isError ? "tasa de respaldo" : "actualizada: " + rateInfo.lastUpdate})`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la tasa BCV",
        variant: "destructive",
      })
    } finally {
      setLoadingBCV(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setError(null)
      if (!initialAmount) {
        setAmount("")
      }
      if (!initialCurrency) {
        setPaymentMethod("CASH")
        setCurrencyType("USD")
      }
      setConversionRate("1")
      setTransactionReference("")
      setNotes("")
      setPaymentDate(new Date())
      setRemainingBalance(null)
    } else if (purchaseId) {
      console.log("Dialog opened with purchaseId:", purchaseId)
      fetchRemainingBalance()
    }
  }, [open, purchaseId, initialAmount, initialCurrency])

  useEffect(() => {
    if (currencyType === "BS" && open) {
      fetchBCVRate()
    }
  }, [currencyType, open])

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  const handleSubmit = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        throw new Error("El monto debe ser mayor a cero")
      }

      setLoading(true)

      // Determine which amount to use based on currency
      const paymentAmount = Number(amount)
      let originalAmount = paymentAmount

      // Handle currency conversion if payment currency differs from sale currency
      if (currencyType !== remainingBalance?.currencyType) {
        if (currencyType === "BS" && remainingBalance?.currencyType === "USD") {
          // Converting from BS to USD
          originalAmount = Number(amount) / Number(conversionRate)
        } else if (currencyType === "USD" && remainingBalance?.currencyType === "BS") {
          // Converting from USD to BS
          originalAmount = Number(amount) * Number(conversionRate)
        }
      }

      const result = await addPartialPayment({
        purchaseId,
        amount: paymentAmount,
        paymentMethod,
        currencyType,
        conversionRate: Number(conversionRate),
        transactionReference: transactionReference || undefined,
        notes: notes || undefined,
        originalAmount: originalAmount,
        paymentDate: paymentDate,
      })

      if (result.success) {
        const message = result.isFullyPaid
          ? "Pago completado. La venta ha sido marcada como pagada."
          : `Se ha registrado el pago de ${currencyType === "BS" ? `Bs. ${paymentAmount}` : formatCurrency(paymentAmount)}`

        toast({
          title: result.isFullyPaid ? "Pago completado" : "Pago registrado",
          description: message,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })

        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
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

  const handleBsAmountChange = (value: string) => {
    setBsAmount(value)
    if (value && conversionRate) {
      const usdAmount = (Number(value) / Number(conversionRate)).toFixed(2)
      setAmount(usdAmount)
    } else {
      setAmount("")
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (value && conversionRate && currencyType === "BS") {
      const bsValue = (Number(value) * Number(conversionRate)).toFixed(2)
      setBsAmount(bsValue)
    }
  }

  const handleCurrencyChange = async (value: string) => {
    setCurrencyType(value)
    if (value === "BS") {
      await fetchBCVRate()
      if (amount) {
        const bsValue = (Number(amount) * Number(conversionRate)).toFixed(2)
        setBsAmount(bsValue)
      }
    } else {
      setConversionRate("1")
      setBsAmount("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Registrar Abono
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadingBalance ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : remainingBalance ? (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Monto total</div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrency(remainingBalance.totalAmount)} {remainingBalance.currencyType}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total pagado</div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrency(remainingBalance.totalPaid)} {remainingBalance.currencyType}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">Saldo pendiente</div>
                <div className="text-2xl font-bold mt-1">
                  {formatCurrency(remainingBalance.remainingAmount)} {remainingBalance.currencyType}
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Fecha de pago */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de pago</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="paymentDate">
                    <Calendar className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP", { locale: es }) : "Seleccionar fecha"}
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

            {/* Only show currency selection if sale is in USD */}
            {(!remainingBalance || remainingBalance.currencyType === "USD") && (
              <div className="space-y-2">
                <Label htmlFor="currencyType">Moneda de Pago</Label>
                <Select value={currencyType} onValueChange={handleCurrencyChange}>
                  <SelectTrigger id="currencyType">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BS">BS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {currencyType === "BS" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bsAmount">Monto en Bs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">Bs.</span>
                    <Input
                      id="bsAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={bsAmount}
                      onChange={(e) => handleBsAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                </div>
                {remainingBalance?.currencyType === "USD" && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Equivalente en USD</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Tasa: {conversionRate} Bs/USD</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={fetchBCVRate}
                        disabled={loadingBCV}
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingBCV ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="amount">Monto en USD</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

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
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional sobre el pago"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !remainingBalance} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {loading ? "Procesando..." : "Registrar Abono"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

