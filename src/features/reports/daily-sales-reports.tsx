"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2, RefreshCw, LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSalesSummaryForDate } from "./actions"
import { formatSaleCurrency } from "@/lib/exchangeRates"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function DailySalesReport() {
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  // Load report data
  const loadReport = async () => {
    setLoading(true)
    try {
      const result = await getSalesSummaryForDate(date)
      if (result.success) {
        setReport(result.data)
      } else {
        throw new Error(result.error || "Error al generar el reporte")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el reporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load report on mount and when date changes
  useEffect(() => {
    loadReport()
  }, [date])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Cierre Diario</h1>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={loadReport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Direct Sales Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Ventas Directas</CardTitle>
                  <CardDescription>{format(date, "PPP", { locale: es })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Ventas</p>
                        <p className="text-2xl font-bold">{report.directSales.count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Monto Total</p>
                        <p className="text-2xl font-bold">{formatSaleCurrency(report.directSales.total)}</p>
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
                          <p className="text-xl font-bold mt-1">{formatSaleCurrency(report.directSales.totalUSD)}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="bs" className="pt-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total en BS</p>
                          <p className="text-xl font-bold mt-1">{report.directSales.totalBS.toFixed(2)} Bs</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Pagos Recibidos</CardTitle>
                  <CardDescription>{format(date, "PPP", { locale: es })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Pagos</p>
                        <p className="text-2xl font-bold">{report.payments.count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Monto Total</p>
                        <p className="text-2xl font-bold">{formatSaleCurrency(report.payments.total)}</p>
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
                          <p className="text-xl font-bold mt-1">{formatSaleCurrency(report.payments.totalUSD)}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="bs" className="pt-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total en BS</p>
                          <p className="text-xl font-bold mt-1">{report.payments.totalBS.toFixed(2)} Bs</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Total Card */}
              <Card className="bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle>Total del Día</CardTitle>
                  <CardDescription>{format(date, "PPP", { locale: es })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Transacciones</p>
                        <p className="text-2xl font-bold">{report.directSales.count + report.payments.count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Monto Total</p>
                        <p className="text-2xl font-bold">
                          {formatSaleCurrency(Number(report.directSales.total) + Number(report.payments.total))}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total USD</p>
                        <p className="text-xl font-bold mt-1">
                          {formatSaleCurrency(Number(report.directSales.totalUSD) + Number(report.payments.totalUSD))}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total BS</p>
                        <p className="text-xl font-bold mt-1">
                          {(Number(report.directSales.totalBS) + Number(report.payments.totalBS)).toFixed(2)} Bs
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Pagos</CardTitle>
              <CardDescription>Pagos recibidos el {format(date, "PPP", { locale: es })}</CardDescription>
            </CardHeader>
            <CardContent>
              {report && report.paymentsList.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2 text-left">Cliente</th>
                        <th className="px-4 py-2 text-left">Método</th>
                        <th className="px-4 py-2 text-right">Monto</th>
                        <th className="px-4 py-2 text-left">Referencia</th>
                        <th className="px-4 py-2 text-center">Venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.paymentsList.map((payment: any) => (
                        <tr key={payment.id} className="border-t">
                          <td className="px-4 py-2">{format(new Date(payment.paymentDate), "dd/MM/yyyy HH:mm")}</td>
                          <td className="px-4 py-2">{payment.sale?.client?.name || "Cliente no registrado"}</td>
                          <td className="px-4 py-2">{payment.paymentMethod}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatSaleCurrency(
                              Number(payment.amount),
                              payment.currencyType || "USD",
                              payment.conversionRate,
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">{payment.transactionReference || "-"}</td>
                          <td className="px-4 py-2 text-center">
                            <Button variant="link" size="sm" asChild>
                              <Link href={`/sales/${payment.purchaseId}`}>
                                <LinkIcon className="h-4 w-4 mr-1" />
                                Ver
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay pagos registrados para esta fecha.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

