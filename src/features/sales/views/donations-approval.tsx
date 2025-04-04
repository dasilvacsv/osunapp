"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { updateSaleDraftStatus, updateSaleDonation } from "@/features/sales/actions"
import { useRouter } from "next/navigation"

interface DonationsApprovalProps {
  donations: any[]
  onRefresh: () => void
  isLoading: boolean
}

export function DonationsApproval({ donations, onRefresh, isLoading }: DonationsApprovalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const formatDate = (date: Date | string) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd/MM/yyyy", { locale: es })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id)
      // First, set isDraft to false to approve the donation
      const result = await updateSaleDraftStatus(id, false)

      if (result.success) {
        toast({
          title: "Donación aprobada",
          description: "La donación ha sido aprobada exitosamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        onRefresh()
      } else {
        throw new Error(result.error || "Error al aprobar la donación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al aprobar la donación",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id)
      // Remove the donation flag
      const result = await updateSaleDonation(id, false)

      if (result.success) {
        toast({
          title: "Donación rechazada",
          description: "La donación ha sido rechazada",
          className: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
        })
        onRefresh()
      } else {
        throw new Error(result.error || "Error al rechazar la donación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al rechazar la donación",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const navigateToSale = (id: string) => {
    router.push(`/sales/${id}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Donaciones Pendientes
          </CardTitle>
          <CardDescription>No hay donaciones pendientes de aprobación</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Button variant="outline" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-amber-500" />
            Donaciones Pendientes
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </CardTitle>
        <CardDescription>Donaciones que requieren aprobación</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Beneficiario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">
                    <Button
                      variant="link"
                      onClick={() => navigateToSale(donation.id)}
                      className="p-0 h-auto font-medium"
                    >
                      #{donation.id.slice(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell>{donation.client?.name || "N/A"}</TableCell>
                  <TableCell>{formatDate(donation.purchaseDate)}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(donation.totalAmount))} {donation.currencyType}
                  </TableCell>
                  <TableCell>{donation.beneficiario?.firstName || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(donation.id)}
                        disabled={processingId === donation.id}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/40"
                      >
                        {processingId === donation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(donation.id)}
                        disabled={processingId === donation.id}
                        className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/40"
                      >
                        {processingId === donation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Rechazar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

