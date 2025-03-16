"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download, RefreshCw, DollarSign, CreditCard } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getDailySalesReport } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export function DailySalesReport() {
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReport()
  }, [date])

  const fetchReport = async () => {
    try {
      setIsLoading(true)
      const result = await getDailySalesReport(date)

      if (result.success) {
        setReportData(result.data)
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
    </div>
  )
}

