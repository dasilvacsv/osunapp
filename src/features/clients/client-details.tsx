"use client"

import { useCallback, useState, useTransition, useMemo } from "react"
import { BeneficiaryTable } from "./beneficiary-table"
import { createBeneficiary, updateBeneficiary, deleteBeneficiary } from "@/app/(app)/clientes/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Client, Organization, Beneficiary } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, Clock, DollarSign, CreditCard, Send, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { sendPaymentConfirmation } from "@/app/(app)/clientes/client-payment-actions"
import { toast } from "@/hooks/use-toast"

interface ClientDetailsProps {
  client: Client
  initialBeneficiaries?: Beneficiary[]
  organizations: Organization[]
  purchases?: any[]
  payments?: any[]
  paymentSummary?: any
}

export function ClientDetails({
  client,
  initialBeneficiaries = [],
  organizations,
  purchases = [],
  payments = [],
  paymentSummary,
}: ClientDetailsProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries)
  const [isPending, startTransition] = useTransition()
  const [sendingConfirmation, setSendingConfirmation] = useState<string | null>(null)

  // Calculate payment statistics from purchases and payments
  const paymentStats = useMemo(() => {
    // Initialize counters
    const stats = {
      totalPurchases: purchases.length,
      paidPurchases: 0,
      pendingPurchases: 0,
      overduePurchases: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    }

    // Count purchases by status
    purchases.forEach((purchase) => {
      const amount = Number(purchase.totalAmount)
      stats.totalAmount += amount

      if (purchase.isPaid) {
        stats.paidPurchases++
        stats.paidAmount += amount
      } else {
        // Check if purchase is overdue (more than 30 days old)
        const purchaseDate = new Date(purchase.purchaseDate)
        const daysSincePurchase = Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSincePurchase > 30) {
          stats.overduePurchases++
          stats.overdueAmount += amount
        } else {
          stats.pendingPurchases++
          stats.pendingAmount += amount
        }
      }
    })

    return stats
  }, [purchases])

  const handleCreateBeneficiary = useCallback(
    async (data: any) => {
      startTransition(async () => {
        const result = await createBeneficiary({ ...data, clientId: client.id })
        if (result.success && result.data) {
          const newBeneficiary = {
            ...result.data,
            status: result.data.status || "ACTIVE",
            organization:
              result.data.organizationId && result.data.organizationId !== "none"
                ? organizations.find((o) => o.id === result.data.organizationId)
                : undefined,
          } as Beneficiary

          setBeneficiaries((prev) => [...prev, newBeneficiary])
        }
      })
    },
    [client.id, organizations],
  )

  const handleUpdateBeneficiary = useCallback(
    async (id: string, data: any) => {
      startTransition(async () => {
        const result = await updateBeneficiary(id, data)
        if (result.success && result.data) {
          setBeneficiaries((prev) =>
            prev.map((beneficiary) => {
              if (beneficiary.id === id) {
                const updatedBeneficiary = {
                  ...result.data,
                  status: result.data.status || "ACTIVE",
                  organization:
                    result.data.organizationId && result.data.organizationId !== "none"
                      ? organizations.find((o) => o.id === result.data.organizationId)
                      : undefined,
                } as Beneficiary
                return updatedBeneficiary
              }
              return beneficiary
            }),
          )
        }
      })
    },
    [organizations],
  )

  const handleDeleteBeneficiary = useCallback(async (id: string) => {
    startTransition(async () => {
      const result = await deleteBeneficiary(id)
      if (result.success) {
        setBeneficiaries((prev) => prev.filter((beneficiary) => beneficiary.id !== id))
      }
    })
  }, [])

  const handleSendConfirmation = async (purchaseId: string) => {
    setSendingConfirmation(purchaseId)
    try {
      const result = await sendPaymentConfirmation(purchaseId)
      if (result.success) {
        toast({
          title: "Confirmación enviada",
          description: "Se ha enviado la confirmación de pago al cliente",
          variant: "success",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar la confirmación",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar la confirmación",
        variant: "destructive",
      })
    } finally {
      setSendingConfirmation(null)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{client.name}</CardTitle>
              <CardDescription>
                {client.role === "PARENT"
                  ? "Padre/Representante"
                  : client.role === "EMPLOYEE"
                    ? "Empleado"
                    : "Individual"}
                {client.organization && ` - ${client.organization.name}`}
              </CardDescription>
            </div>
            {client.deudor && (
              <Badge variant="destructive" className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Deudor
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
        <BeneficiaryTable
                beneficiaries={beneficiaries}
                isLoading={isPending}
                clientId={client.id}
                onCreateBeneficiary={handleCreateBeneficiary}
                onUpdateBeneficiary={handleUpdateBeneficiary}
                onDeleteBeneficiary={handleDeleteBeneficiary}
                organizations={organizations}
              />
        </CardContent>
      </Card>
    </div>
  )
}

