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
          {/* Payment Summary Section */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Resumen de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Counts */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Estado de Compras</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Pagadas</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        {paymentStats.paidPurchases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Pendientes</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50">
                        {paymentStats.pendingPurchases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Vencidas</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50">
                        {paymentStats.overduePurchases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 font-medium">
                        <span>Total</span>
                      </div>
                      <Badge variant="outline">{paymentStats.totalPurchases}</Badge>
                    </div>
                  </div>
                </div>

                {/* Amount Totals */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Montos</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Gastado:</span>
                      <span className="font-medium">{formatCurrency(paymentStats.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Pagado:</span>
                      <span className="font-medium text-green-600">{formatCurrency(paymentStats.paidAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Pendiente:</span>
                      <span className="font-medium text-yellow-600">{formatCurrency(paymentStats.pendingAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Vencido:</span>
                      <span className="font-medium text-red-600">{formatCurrency(paymentStats.overdueAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progreso de pago</span>
                  <span>{Math.round((paymentStats.paidAmount / paymentStats.totalAmount) * 100)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${Math.round((paymentStats.paidAmount / paymentStats.totalAmount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="payments">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="beneficiaries">Beneficiarios</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              <div className="space-y-6">
                {paymentSummary && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Amount Card */}
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{formatCurrency(paymentSummary.totalAmount)}</div>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Paid Amount Card */}
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total Pagado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(paymentSummary.paidAmount)}
                            </div>
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {Math.round((paymentSummary.paidAmount / paymentSummary.totalAmount) * 100)}% del total
                          </div>
                        </CardContent>
                      </Card>

                      {/* Remaining Balance Card */}
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Pendiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div
                              className={`text-2xl font-bold ${paymentSummary.remainingBalance > 0 ? "text-amber-600" : "text-green-600"}`}
                            >
                              {formatCurrency(paymentSummary.remainingBalance)}
                            </div>
                            {paymentSummary.remainingBalance > 0 ? (
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Payment Status and Last Payment Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Estado de Cuenta</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Estado:</span>
                            <Badge
                              className={
                                paymentSummary.status === "PAID"
                                  ? "bg-green-100 text-green-600"
                                  : paymentSummary.status === "PARTIAL"
                                    ? "bg-blue-100 text-blue-600"
                                    : paymentSummary.status === "OVERDUE"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-yellow-100 text-yellow-600"
                              }
                            >
                              {paymentSummary.status === "PAID"
                                ? "Pagado"
                                : paymentSummary.status === "PARTIAL"
                                  ? "Pago Parcial"
                                  : paymentSummary.status === "OVERDUE"
                                    ? "Vencido"
                                    : "Pendiente"}
                            </Badge>
                          </div>

                          {paymentSummary.lastPaymentDate && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Último pago:</span>
                                <span className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {format(new Date(paymentSummary.lastPaymentDate), "PPP", { locale: es })}
                                </span>
                              </div>

                              {paymentSummary.daysSinceLastPayment !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Días desde último pago:</span>
                                  <span
                                    className={`flex items-center gap-2 ${paymentSummary.isOverdue ? "text-red-500 font-medium" : ""}`}
                                  >
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {paymentSummary.daysSinceLastPayment} días
                                    {paymentSummary.isOverdue && " (Vencido)"}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Purchases List */}
                {purchases.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Compras</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                              <TableCell>
                                {purchase.purchaseDate ? format(new Date(purchase.purchaseDate), "dd/MM/yyyy") : "-"}
                              </TableCell>
                              <TableCell>{formatCurrency(Number(purchase.totalAmount))}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    purchase.isPaid ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                                  }
                                >
                                  {purchase.isPaid ? "Pagado" : "Pendiente"}
                                </Badge>
                              </TableCell>
                              <TableCell>{purchase.paymentMethod || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleSendConfirmation(purchase.id)}
                                  disabled={sendingConfirmation === purchase.id}
                                >
                                  {sendingConfirmation === purchase.id ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Payment List */}
                {payments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Historial de Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Referencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {payment.paymentDate
                                  ? format(new Date(payment.paymentDate), "dd/MM/yyyy")
                                  : payment.dueDate
                                    ? format(new Date(payment.dueDate), "dd/MM/yyyy")
                                    : "-"}
                              </TableCell>
                              <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                              <TableCell>{payment.paymentMethod || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    payment.status === "PAID"
                                      ? "bg-green-100 text-green-600"
                                      : payment.status === "PARTIAL"
                                        ? "bg-blue-100 text-blue-600"
                                        : payment.status === "OVERDUE"
                                          ? "bg-red-100 text-red-600"
                                          : "bg-yellow-100 text-yellow-600"
                                  }
                                >
                                  {payment.status === "PAID"
                                    ? "Pagado"
                                    : payment.status === "PARTIAL"
                                      ? "Parcial"
                                      : payment.status === "OVERDUE"
                                        ? "Vencido"
                                        : "Pendiente"}
                                </Badge>
                              </TableCell>
                              <TableCell>{payment.transactionReference || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {purchases.length === 0 && payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay compras o pagos registrados para este cliente
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="beneficiaries">
              <BeneficiaryTable
                beneficiaries={beneficiaries}
                isLoading={isPending}
                clientId={client.id}
                onCreateBeneficiary={handleCreateBeneficiary}
                onUpdateBeneficiary={handleUpdateBeneficiary}
                onDeleteBeneficiary={handleDeleteBeneficiary}
                organizations={organizations}
              />
            </TabsContent>
            <TabsContent value="info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium">Información del Cliente</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Nombre:</span>
                      <span>{client.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Documento:</span>
                      <span>{client.document || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Teléfono:</span>
                      <span>{client.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">WhatsApp:</span>
                      <span>{client.whatsapp || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Email:</span>
                      <span>{client.contactInfo?.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Organización:</span>
                      <span>{client.organization?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Estado de Cuenta:</span>
                      <span className={client.deudor ? "text-red-500 font-semibold" : "text-green-500"}>
                        {client.deudor ? "Deudor" : "Al día"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

