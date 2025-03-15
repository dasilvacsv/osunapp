"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { registerPurchasePayment } from "../stock/actions"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { DollarSign, CreditCard, Receipt, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface PurchasePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string
  totalAmount: number
  paidAmount: number
  onPaymentRegistered: () => void
}

export function PurchasePaymentDialog({
  open,
  onOpenChange,
  purchaseId,
  totalAmount,
  paidAmount,
  onPaymentRegistered,
}: PurchasePaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const remainingAmount = totalAmount - paidAmount
  const isValidAmount = Number(amount) > 0 && Number(amount) <= remainingAmount

  const resetForm = () => {
    setAmount("")
    setPaymentMethod("CASH")
    setReference("")
    setNotes("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidAmount) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0 y no exceder el saldo pendiente",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await registerPurchasePayment(
        purchaseId,
        Number(amount),
        paymentMethod,
        reference || undefined,
        notes || undefined,
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Pago registrado exitosamente",
          duration: 3000,
        })
        onPaymentRegistered()
        onOpenChange(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error registering payment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-5 h-5 text-primary" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Total:</span>
                <p className="font-medium">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pagado:</span>
                <p className="font-medium">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">Saldo pendiente:</span>
                <p className="font-bold text-lg text-primary">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Monto a Pagar
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
                required
              />
              {amount && !isValidAmount && (
                <p className="text-sm text-destructive">
                  El monto debe ser mayor a 0 y no exceder {formatCurrency(remainingAmount)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" />
                Método de Pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Referencia
              </Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full"
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                placeholder="Información adicional sobre el pago"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isValidAmount} className="relative">
              {loading ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </motion.div>
              ) : (
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Registrar Pago
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

