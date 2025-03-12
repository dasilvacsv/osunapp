"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, FileSpreadsheet, CheckCircle2, CreditCard, Calendar, Package, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportSaleToExcel } from "./actions"

interface SaleExportData {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  purchaseDate: string
  status: string
  paymentMethod: string
  totalAmount: string
  transactionReference: string
  isPaid: boolean
  saleType: string
  items: {
    name: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }[]
  // Payment information
  paymentsCount?: number
  pendingPayments?: number
  nextPaymentDueDate?: string
  pendingAmount?: string
  installmentPlan?: string
}

interface ExportSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
}

export function ExportSaleDialog({ open, onOpenChange, saleId }: ExportSaleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<SaleExportData | null>(null)
  const [activeTab, setActiveTab] = useState("preview")

  // Fetch preview data when dialog opens
  useEffect(() => {
    if (open && !previewData && !loading) {
      fetchPreviewData()
    }
  }, [open, previewData, loading])

  const fetchPreviewData = async () => {
    if (!saleId) return

    setLoading(true)
    try {
      const result = await exportSaleToExcel(saleId, false)
      if (result.success && result.data) {
        setPreviewData(result.data)
      } else {
        throw new Error(result.error || "No se pudieron cargar los datos para la vista previa")
      }
    } catch (error) {
      console.error("Error fetching preview data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los datos para la vista previa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle export to Excel
  const handleExport = async () => {
    if (!saleId) return

    setLoading(true)
    try {
      const result = await exportSaleToExcel(saleId, true)
      if (result.success) {
        // Create a download link and trigger download
        if (result.downloadUrl) {
          const link = document.createElement("a")
          link.href = result.downloadUrl
          link.setAttribute("download", result.filename || "venta.xlsx")
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          toast({
            title: "Exportación exitosa",
            description: "Los datos de la venta se han exportado correctamente a Excel",
            className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          })
          onOpenChange(false)
        } else {
          throw new Error("No se pudo generar el enlace de descarga")
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al exportar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Exportar Venta a Excel
          </DialogTitle>
          <DialogDescription>Vista previa de los datos que se exportarán a Excel</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            <TabsTrigger value="fields">Campos a Exportar</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="border rounded-md">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Cargando datos...</span>
              </div>
            ) : !previewData ? (
              <div className="text-center py-12 text-muted-foreground">No hay datos disponibles para exportar</div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <h3 className="font-medium text-lg flex items-center gap-2 mb-3">
                          <User className="h-5 w-5 text-primary" />
                          Datos del Cliente
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Nombre:</span>
                            <span className="font-medium">{previewData.clientName}</span>
                          </div>
                          {previewData.clientEmail && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Email:</span>
                              <span>{previewData.clientEmail}</span>
                            </div>
                          )}
                          {previewData.clientPhone && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Teléfono:</span>
                              <span>{previewData.clientPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <h3 className="font-medium text-lg flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          Detalles de la Venta
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Fecha:</span>
                            <span>{previewData.purchaseDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <Badge variant="outline">{previewData.status}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Método de pago:</span>
                            <Badge variant="outline">{previewData.paymentMethod}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tipo de venta:</span>
                            <Badge variant="outline">
                              {previewData.saleType === "DIRECT"
                                ? "Directa"
                                : previewData.saleType === "PRESALE"
                                  ? "Preventa"
                                  : previewData.saleType}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Pagado:</span>
                            <Badge variant={previewData.isPaid ? "success" : "secondary"}>
                              {previewData.isPaid ? "Sí" : "No"}
                            </Badge>
                          </div>
                          {previewData.transactionReference && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Referencia:</span>
                              <span className="font-mono text-xs">{previewData.transactionReference}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {previewData.paymentsCount && previewData.paymentsCount > 0 && (
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <h3 className="font-medium text-lg flex items-center gap-2 mb-3">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Información de Pagos
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total de pagos:</span>
                              <span>{previewData.paymentsCount}</span>
                            </div>
                            {previewData.pendingPayments !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Pagos pendientes:</span>
                                <Badge variant={previewData.pendingPayments > 0 ? "destructive" : "outline"}>
                                  {previewData.pendingPayments}
                                </Badge>
                              </div>
                            )}
                            {previewData.pendingAmount && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Monto pendiente:</span>
                                <span className="font-medium text-destructive">{previewData.pendingAmount}</span>
                              </div>
                            )}
                            {previewData.nextPaymentDueDate && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Próximo vencimiento:</span>
                                <span>{previewData.nextPaymentDueDate}</span>
                              </div>
                            )}
                            {previewData.installmentPlan && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Plan de pagos:</span>
                                <span>{previewData.installmentPlan}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <h3 className="font-medium text-lg flex items-center gap-2 mb-3">
                          <Package className="h-5 w-5 text-primary" />
                          Productos
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cant.</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{item.unitPrice}</TableCell>
                                <TableCell className="text-right">{item.totalPrice}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end mt-4">
                          <div className="bg-muted/50 rounded p-2 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Total:</span>
                              <span className="font-bold text-lg">{previewData.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="fields" className="border rounded-md p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>ID de Venta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Nombre del Cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Email del Cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Teléfono del Cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Fecha de Compra</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Estado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Método de Pago</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Monto Total</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Referencia de Transacción</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Pagado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Tipo de Venta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Lista de Productos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Total de Pagos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Pagos Pendientes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Próximo Vencimiento</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Monto Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Plan de Pagos</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading || !previewData} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar a Excel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

