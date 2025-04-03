"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { formatSaleCurrency } from "@/lib/exchangeRates"
import { Gift, CheckCircle, Loader2, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDonationSalesData } from "./actions"
import { useRouter } from "next/navigation"

interface DonationsHistoryProps {
  onRefresh?: () => void
}

export function DonationsHistory({ onRefresh }: DonationsHistoryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApprovedDonations()
  }, [])

  const fetchApprovedDonations = async () => {
    try {
      setIsLoading(true)
      // Get all donations including approved ones
      const result = await getDonationSalesData(true)

      if (result.success) {
        // Filter to only show approved donations (isDraft = false)
        const approvedDonations = result.data.filter((donation) => !donation.isDraft)
        setDonations(approvedDonations)
      } else {
        throw new Error(result.error || "Error al cargar donaciones aprobadas")
      }
    } catch (error) {
      console.error("Error fetching approved donations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar donaciones aprobadas",
        variant: "destructive",
      })
      setDonations([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchApprovedDonations()
    if (onRefresh) onRefresh()
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
            <Gift className="h-5 w-5" />
            Historial de Donaciones
          </CardTitle>
          <CardDescription>No hay donaciones aprobadas</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            Historial de Donaciones
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </CardTitle>
        <CardDescription>Donaciones aprobadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Beneficiario</TableHead>
                <TableHead>Paquete</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                  <TableCell>{donation.beneficiario?.name || "N/A"}</TableCell>
                  <TableCell>{donation.bundle?.name || "N/A"}</TableCell>
                  <TableCell>{formatDate(donation.purchaseDate)}</TableCell>
                  <TableCell>
                    {formatSaleCurrency(
                      Number(donation.totalAmount),
                      donation.currencyType || "USD",
                      Number(donation.conversionRate) || 1,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Aprobada
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToSale(donation.id)}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Ver detalles
                    </Button>
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

