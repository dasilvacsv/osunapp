"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createPaymentPlan } from "./payment-actions"
import { CalendarIcon, Calculator, CreditCard, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string
  totalAmount: number
  onSuccess?: () => void
}

export function PaymentPlanDialog({ open, onOpenChange, purchaseId, totalAmount, onSuccess }: PaymentPlanDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [downPayment, setDownPayment] = useState(0)
  const [installmentCount, setInstallmentCount] = useState(3)
  const [installmentFrequency, setInstallmentFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("MONTHLY")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [installmentAmount, setInstallmentAmount] = useState(totalAmount / 3)

  // Calcular el monto de las cuotas cuando cambian los valores
  const calculateInstallmentAmount = (total: number, down: number, count: number) => {
    if (count <= 0) return 0
    return (total - down) / count
  }

  const handleDownPaymentChange = (value: string) => {
    const amount = Number.parseFloat(value) || 0
    // Asegurar que el pago inicial no sea mayor que el total
    const validAmount = Math.min(amount, totalAmount)
    setDownPayment(validAmount)
    setInstallmentAmount(calculateInstallmentAmount(totalAmount, validAmount, installmentCount))
  }

  const handleInstallmentCountChange = (value: string) => {
    const count = Number.parseInt(value) || 1
    setInstallmentCount(count)
    setInstallmentAmount(calculateInstallmentAmount(totalAmount, downPayment, count))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (installmentCount <= 0) {
        toast({
          title: "Error",
          description: "El número de cuotas debe ser mayor a cero",
          variant: "destructive",
        })
        return
      }

      if (downPayment >= totalAmount) {
        toast({
          title: "Error",
          description: "El pago inicial no puede ser igual o mayor al monto total",
          variant: "destructive",
        })
        return
      }

      const result = await createPaymentPlan({
        purchaseId,
        totalAmount,
        downPayment,
        installmentCount,
        installmentFrequency,
        startDate,
      })

      if (result.success) {
        toast({
          title: "Plan de pago creado",
          description: `Se han generado ${installmentCount} cuotas de ${formatCurrency(installmentAmount)}`,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el plan de pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Crear Plan de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground">Monto total de la venta</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="downPayment">Pago inicial (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="downPayment"
                  type="number"
                  min={0}
                  max={totalAmount}
                  step="0.01"
                  value={downPayment}
                  onChange={(e) => handleDownPaymentChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installmentCount">Número de cuotas</Label>
                <Input
                  id="installmentCount"
                  type="number"
                  min="1"
                  value={installmentCount}
                  onChange={(e) => handleInstallmentCountChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Select
                  value={installmentFrequency}
                  onValueChange={(value) => setInstallmentFrequency(value as "WEEKLY" | "BIWEEKLY" | "MONTHLY")}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto por cuota</span>
              <span className="font-semibold">{formatCurrency(installmentAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a financiar</span>
              <span className="font-semibold">{formatCurrency(totalAmount - downPayment)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {loading ? "Creando..." : "Crear Plan de Pago"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}