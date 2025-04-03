"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Gift, RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/features/sales/views/data-table"
import { columns } from "@/features/sales/views/columns"
import { DonationsApproval } from "@/features/sales/views/donations-approval"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { getDonationSalesData, getPendingDonations, getApprovedDonations } from "./actions"

interface DonationsTabProps {
  initialData?: any[]
}

export function DonationsTab({ initialData = [] }: DonationsTabProps) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [allDonations, setAllDonations] = useState<any[]>(initialData)
  const [pendingDonations, setPendingDonations] = useState<any[]>([])
  const [approvedDonations, setApprovedDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(!initialData.length)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [approvedLoading, setApprovedLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!initialData.length) {
      fetchAllDonations()
    }

    fetchPendingDonations()
    fetchApprovedDonations()
  }, [initialData.length])

  const fetchAllDonations = async () => {
    try {
      setLoading(true)
      const result = await getDonationSalesData()

      if (result.success) {
        setAllDonations(result.data || [])
      } else {
        throw new Error(result.error || "Error fetching donation sales")
      }
    } catch (error) {
      console.error("Error fetching donation sales:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error fetching donation sales",
        variant: "destructive",
      })
      setAllDonations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDonations = async () => {
    try {
      setPendingLoading(true)
      const result = await getPendingDonations()

      if (result.success) {
        setPendingDonations(result.data || [])
      } else {
        throw new Error(result.error || "Error fetching pending donations")
      }
    } catch (error) {
      console.error("Error fetching pending donations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error fetching pending donations",
        variant: "destructive",
      })
      setPendingDonations([])
    } finally {
      setPendingLoading(false)
    }
  }

  const fetchApprovedDonations = async () => {
    try {
      setApprovedLoading(true)
      const result = await getApprovedDonations()

      if (result.success) {
        setApprovedDonations(result.data || [])
      } else {
        throw new Error(result.error || "Error fetching approved donations")
      }
    } catch (error) {
      console.error("Error fetching approved donations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error fetching approved donations",
        variant: "destructive",
      })
      setApprovedDonations([])
    } finally {
      setApprovedLoading(false)
    }
  }

  const refreshData = () => {
    fetchAllDonations()
    fetchPendingDonations()
    fetchApprovedDonations()
  }

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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Todas las Donaciones
          </TabsTrigger>

          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Loader2 className="h-4 w-4" />
            Pendientes de Aprobación
          </TabsTrigger>

          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Historial de Aprobaciones
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={allDonations}
                searchKey="client.name"
                title="Donaciones"
                description="Lista de ventas marcadas como donación"
              />
            )}
          </TabsContent>

          <TabsContent value="pending">
            <DonationsApproval
              donations={pendingDonations}
              onRefresh={fetchPendingDonations}
              isLoading={pendingLoading}
            />
          </TabsContent>

          <TabsContent value="approved">
            <ApprovedDonationsHistory
              donations={approvedDonations}
              onRefresh={fetchApprovedDonations}
              isLoading={approvedLoading}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function ApprovedDonationsHistory({
  donations,
  onRefresh,
  isLoading,
  formatDate,
  formatCurrency,
}: {
  donations: any[]
  onRefresh: () => void
  isLoading: boolean
  formatDate: (date: Date | string) => string
  formatCurrency: (amount: number) => string
}) {
  const router = useRouter()

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
            Historial de Donaciones Aprobadas
          </CardTitle>
          <CardDescription>No hay donaciones aprobadas en el historial</CardDescription>
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            Historial de Donaciones Aprobadas
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </CardTitle>
        <CardDescription>Donaciones que han sido aprobadas</CardDescription>
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
                <TableHead>Fecha de Aprobación</TableHead>
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
                  <TableCell>{formatDate(donation.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

