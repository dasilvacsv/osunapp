"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportBeneficiaryToExcel, exportBeneficiariesToExcel } from "./actions"

interface BeneficiaryData {
  id: string
  firstName: string
  lastName: string
  school: string
  level: string
  section: string
  status: string
  createdAt: string
  bundleName: string
  bundleType: string
  bundlePrice: string
  purchaseStatus?: string
  purchaseDate?: string
  paymentMethod?: string
  totalAmount?: string
  organizationName?: string
  organizationType?: string
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  beneficiaryId?: string
  beneficiaries?: BeneficiaryData[]
  title?: string
}

export function ExportDialog({
  open,
  onOpenChange,
  beneficiaryId,
  beneficiaries = [],
  title = "Exportar Datos",
}: ExportDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<BeneficiaryData[]>([])
  const [activeTab, setActiveTab] = useState("preview")

  // Fetch preview data when dialog opens
  const fetchPreviewData = async () => {
    setLoading(true)
    try {
      let data: BeneficiaryData[] = []

      if (beneficiaryId) {
        // Single beneficiary export
        const result = await exportBeneficiaryToExcel(beneficiaryId, false)
        if (result.success && result.data) {
          data = [result.data]
        }
      } else if (beneficiaries.length > 0) {
        // Use provided beneficiaries data
        data = beneficiaries
      } else {
        // Fetch all beneficiaries (this would be implemented in your actions)
        const result = await exportBeneficiariesToExcel(false)
        if (result.success && result.data) {
          data = result.data
        }
      }

      setPreviewData(data)
    } catch (error) {
      console.error("Error fetching preview data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos para la vista previa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle export to Excel
  const handleExport = async () => {
    setLoading(true)
    try {
      if (beneficiaryId) {
        // Export single beneficiary
        const result = await exportBeneficiaryToExcel(beneficiaryId, true)
        if (result.success) {
          // Create a download link and trigger download
          const link = document.createElement("a")
          link.href = result.downloadUrl
          link.setAttribute("download", result.filename || "beneficiario.xlsx")
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          toast({
            title: "Exportación exitosa",
            description: "Los datos se han exportado correctamente a Excel",
            className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          })
          onOpenChange(false)
        } else {
          throw new Error(result.error)
        }
      } else {
        // Export multiple beneficiaries
        const result = await exportBeneficiariesToExcel(true)
        if (result.success) {
          // Create a download link and trigger download
          const link = document.createElement("a")
          link.href = result.downloadUrl
          link.setAttribute("download", result.filename || "beneficiarios.xlsx")
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          toast({
            title: "Exportación exitosa",
            description: `Se han exportado ${previewData.length} registros a Excel`,
            className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          })
          onOpenChange(false)
        } else {
          throw new Error(result.error)
        }
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

  // Fetch data when dialog opens
  if (open && previewData.length === 0 && !loading) {
    fetchPreviewData()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {title}
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
            ) : previewData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No hay datos disponibles para exportar</div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Escuela</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Paquete</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.firstName} {item.lastName}
                        </TableCell>
                        <TableCell>{item.school}</TableCell>
                        <TableCell>{item.level}</TableCell>
                        <TableCell>{item.section}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === "ACTIVE" ? "default" : "secondary"}
                            className="flex w-fit items-center gap-1"
                          >
                            {item.status === "ACTIVE" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {item.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.bundleName}</TableCell>
                        <TableCell>{item.bundlePrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="fields" className="border rounded-md p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Nombre Completo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Escuela</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Nivel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Sección</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Estado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Fecha de Registro</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Nombre del Paquete</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Tipo de Paquete</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Precio Base</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Estado de Compra</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Fecha de Compra</span>
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
                <span>Organización</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Tipo de Organización</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading || previewData.length === 0} className="gap-2">
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

