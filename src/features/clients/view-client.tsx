"use client"

import { useEffect, useState } from "react"
import { ClientDetails } from "./client-details"
import { getClient, getOrganizations, getBeneficiariesByClient } from "@/app/(app)/clientes/client"
import type { Client, Organization, Beneficiary } from "@/lib/types"
import { getClientPurchases, getClientPaymentSummary } from "@/app/(app)/clientes/client-payment-actions"

export default function ViewClient({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [paymentSummary, setPaymentSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // Load client data
        const clientResult = await getClient(clientId)
        if (clientResult.error || !clientResult.data) {
          throw new Error(clientResult.error || "No client data found")
        }

        // Load organizations
        const orgsResult = await getOrganizations()
        if (orgsResult.error || !orgsResult.data) {
          throw new Error(orgsResult.error || "No organizations found")
        }

        // Load beneficiaries
        const beneficiariesResult = await getBeneficiariesByClient(clientId)
        if (!beneficiariesResult.success || !beneficiariesResult.data) {
          throw new Error(beneficiariesResult.error || "No beneficiaries found")
        }

        // Load client purchases and payments
        const purchasesResult = await getClientPurchases(clientId)
        if (purchasesResult.success) {
          setPurchases(purchasesResult.data.purchases || [])
          setPayments(purchasesResult.data.payments || [])
        }

        // Load payment summary with enhanced metrics
        const paymentSummaryResult = await getClientPaymentSummary(clientId)
        if (paymentSummaryResult.success) {
          setPaymentSummary(paymentSummaryResult.data)
        }

        // Use type assertions to fix type incompatibilities
        setClient(clientResult.data as Client)
        setOrganizations(orgsResult.data as Organization[])
        setBeneficiaries(beneficiariesResult.data as Beneficiary[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [clientId])

  return (
    <div>
      {isLoading && <div className="py-8 text-center">Cargando...</div>}
      {error && <div className="py-8 text-center text-red-500">{error}</div>}
      {!isLoading && !error && client && (
        <ClientDetails
          client={client}
          initialBeneficiaries={beneficiaries}
          organizations={organizations}
          purchases={purchases}
          payments={payments}
          paymentSummary={paymentSummary}
        />
      )}
    </div>
  )
}

