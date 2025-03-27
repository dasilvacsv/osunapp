"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download, RefreshCw, DollarSign, CreditCard, ExternalLink } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getDailySalesReport } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function DailySalesReport() {
  const router = useRouter()
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const { toast } = useToast()
  // Inside the component, add a state for payments
  const [dailyPayments, setDailyPayments] = useState<any[]>([])
  // Add state for sales details
  const [salesDetails, setSalesDetails] = useState<any[]>([])

  useEffect(() => {
    fetchReport()
  }, [date])

  // Update the fetchReport function to get payments and sales details
  const fetchReport = async () => {
    try {
      setIsLoading(true)
      const result = await getDailySalesReport(date)

      if (result.success) {
        setReportData(result.data)

        // If there are payments, set them
        if (result.data.paymentsDetails && result.data.paymentsDetails.length > 0) {
          setDailyPayments(result.data.paymentsDetails)
        } else {
          setDailyPayments([])
        }

        // If there are sales details, set them
        if (result.data.salesDetails && result.data.salesDetails.length > 0) {
          setSalesDetails(result.data.salesDetails)
        } else {
          setSalesDetails([])
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el reporte",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Implement export functionality
    toast({
      title: "Exportando reporte",
      description: "El reporte se está exportando...",
    })
  }

  const navigateToSale = (id: string) => {
    router.push(`/sales/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cierre Diario</h2>
          <p className="text-muted-foreground">Resumen de ventas y pagos del día</p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatDate(date) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={fetchReport} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          <Button variant="outline" size="icon" onClick={handleExport} disabled={isLoading || !reportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {reportData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Ventas Directas
              </CardTitle>
              <CardDescription>Ventas realizadas el {formatDate(date)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-2xl font-bold">{reportData.directSales.count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monto Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.directSales.total)}</p>
                </div>
              </div>

              <Separator />

              <Tabs defaultValue="usd">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="usd">USD</TabsTrigger>
                  <TabsTrigger value="bs">BS</TabsTrigger>
                </TabsList>
                <TabsContent value="usd" className="pt-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total en USD</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(reportData.directSales.totalUSD)}</p>
                  </div>
                </TabsContent>
                <TabsContent value="bs" className="pt-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total en BS</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(reportData.directSales.totalBS)}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pagos Recibidos
              </CardTitle>
              <CardDescription>Pagos procesados el {formatDate(date)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Pagos</p>
                  <p className="text-2xl font-bold">{reportData.payments.count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monto Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.payments.total)}</p>
                </div>
              </div>

              <Separator />

              <Tabs defaultValue="usd">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="usd">USD</TabsTrigger>
                  <TabsTrigger value="bs">BS</TabsTrigger>
                </TabsList>
                <TabsContent value="usd" className="pt-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total en USD</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(reportData.payments.totalUSD)}</p>
                  </div>
                </TabsContent>
                <TabsContent value="bs" className="pt-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total en BS</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(reportData.payments.totalBS)}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resumen del Día</CardTitle>
              <CardDescription>Totales combinados para {formatDate(date)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Ventas + Pagos</p>
                  <p className="text-xl font-bold mt-1">
                    {formatCurrency(Number(reportData.directSales.total) + Number(reportData.payments.total))}
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Transacciones</p>
                  <p className="text-xl font-bold mt-1">{reportData.directSales.count + reportData.payments.count}</p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total USD</p>
                  <p className="text-xl font-bold mt-1">
                    {formatCurrency(Number(reportData.directSales.totalUSD) + Number(reportData.payments.totalUSD))}
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total BS</p>
                  <p className="text-xl font-bold mt-1">
                    {formatCurrency(Number(reportData.directSales.totalBS) + Number(reportData.payments.totalBS))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            {isLoading ? (
              <>
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium">Generando reporte...</h3>
                <p className="text-muted-foreground mt-2">Obteniendo datos de ventas y pagos</p>
              </>
            ) : (
              <>
                <CalendarIcon className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay datos disponibles</h3>
                <p className="text-muted-foreground mt-2">Selecciona una fecha y haz clic en actualizar</p>
                <Button onClick={fetchReport} className="mt-4">
                  Generar Reporte
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Sales Details Table */}
      {salesDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Ventas</CardTitle>
            <CardDescription>Ventas realizadas el {formatDate(date)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesDetails.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.id.slice(0, 8)}</TableCell>
                      <TableCell>{sale.clientName || "N/A"}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(sale.totalAmount))} {sale.currencyType}
                      </TableCell>
                      <TableCell>{sale.paymentMethod || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            sale.isPaid
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                          )}
                        >
                          {sale.isPaid ? "Pagado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.purchaseDate ? new Date(sale.purchaseDate).toLocaleTimeString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => navigateToSale(sale.id)} className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Table */}
      {dailyPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Pagos</CardTitle>
            <CardDescription>Pagos recibidos el {formatDate(date)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.purchaseId.slice(0, 8)}</TableCell>
                      <TableCell>{payment.clientName || "N/A"}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(payment.amount))} {payment.currencyType}
                      </TableCell>
                      <TableCell>{payment.paymentMethod || "N/A"}</TableCell>
                      <TableCell>{payment.transactionReference || "-"}</TableCell>
                      <TableCell>
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleTimeString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigateToSale(payment.purchaseId)}
                          className="h-8 w-8"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

