"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { PurchasePaymentDialog } from "./purchase-payment-dialog"
import { useRouter } from "next/navigation"

interface PurchasePaymentButtonProps {
  purchaseId: string
  totalAmount: number
  paidAmount: number
}

export function PurchasePaymentButton({ purchaseId, totalAmount, paidAmount }: PurchasePaymentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handlePaymentRegistered = () => {
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} className="w-full">
        <DollarSign className="h-4 w-4 mr-2" />
        Registrar Pago
      </Button>

      <PurchasePaymentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        purchaseId={purchaseId}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onPaymentRegistered={handlePaymentRegistered}
      />
    </>
  )
}

