"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Download, Loader2, User, Phone, Mail, School, DollarSign, Package } from "lucide-react";
import { FichaData } from "./types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getFichaData } from "./actions";

// Print styles
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      
      body * {
        visibility: hidden;
      }
      
      .dialog-content,
      .dialog-content * {
        visibility: visible;
      }
      
      .dialog-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
      
      .print-only {
        display: block !important;
      }
      
      .no-print {
        display: none !important;
      }
    }
  `}</style>
);

interface FichaTriggerProps {
  purchaseId: string;
  children?: React.ReactNode;
}

export function FichaTrigger({ purchaseId, children }: FichaTriggerProps) {
  const [fichaData, setFichaData] = useState<FichaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadFichaData = async () => {
    if (fichaData) return; // Already loaded
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getFichaData(purchaseId);
      if (response.success && response.data) {
        setFichaData(response.data);
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      console.error("Error loading ficha data:", err);
      setError("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPDF = () => {
    // For now, we'll just use window.print() to print the dialog content
    // In a real implementation, you would use a library like react-pdf or jspdf
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <PrintStyles />
      <TooltipProvider>
        <Tooltip>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              {children || (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    loadFichaData();
                    setIsOpen(true);
                  }}
                >
                  <span className="sr-only">Ver ficha</span>
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent>
            <p>Ver ficha del cliente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-3xl dialog-content">
        <DialogHeader>
          <DialogTitle>Ficha de Compra</DialogTitle>
          <DialogDescription>
            Resumen detallado de la información de compra
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : !fichaData ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">No se pudieron cargar los datos</p>
          </div>
        ) : (
          <div className="print:py-6">
            {/* Header with Logo and Title */}
            <div className="flex flex-col items-center mb-6 print:mb-4">
              <h1 className="text-xl font-bold">Osuna Fotografías 📸</h1>
              <p className="text-muted-foreground">Paquetes de Grado 👨🏻‍🎓</p>
            </div>
            
            {/* Client Information */}
            <Card className="mb-4 print:shadow-none print:border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  DATOS DEL REPRESENTANTE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre y Apellido:</p>
                    <p className="font-medium">{fichaData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">C.I:</p>
                    <p className="font-medium">{fichaData.clientDocument}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Celular ó Tlf:</p>
                    <p className="font-medium">{fichaData.clientPhone || fichaData.clientWhatsapp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Correo Electrónico:</p>
                    <p className="font-medium">{fichaData.clientEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Student Information */}
            <Card className="mb-4 print:shadow-none print:border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <School className="h-4 w-4" />
                  DATOS DEL ALUMNO 👨‍🎓
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fichaData.beneficiarioName ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Apellidos del alumno:</p>
                        <p className="font-medium">{fichaData.beneficiarioLastName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nombres del alumno:</p>
                        <p className="font-medium">{fichaData.beneficiarioFirstName}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="col-span-1 sm:col-span-3">
                        <p className="text-xs text-muted-foreground">Nombre del Colegio:</p>
                        <p className="font-medium">{fichaData.beneficiarioSchool || fichaData.organizationName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nivel:</p>
                        <p className="font-medium">{fichaData.beneficiarioGrade}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sección:</p>
                        <p className="font-medium">{fichaData.beneficiarioSection}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No hay datos del alumno registrados</p>
                )}
              </CardContent>
            </Card>
            
            {/* Package Information */}
            <Card className="mb-4 print:shadow-none print:border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  INFORMACIÓN DEL PAQUETE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre del Paquete:</p>
                  <p className="font-medium">{fichaData.bundleName}</p>
                </div>
                
                {fichaData.bundleItems.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contenido del Paquete:</p>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {fichaData.bundleItems.map((item, idx) => (
                        <li key={idx}>
                          {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Payment Information */}
            <Card className="mb-4 print:shadow-none print:border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  INFORMACIÓN DE PAGO 🧾
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Costo del Paquete:</p>
                    <p className="font-medium">{formatCurrency(fichaData.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cargos adicionales:</p>
                    <p className="font-medium">{formatCurrency(0)}</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Abono de:</p>
                    <p className="font-medium">{formatCurrency(fichaData.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resta:</p>
                    <p className="font-medium text-red-500">{formatCurrency(fichaData.remaining)}</p>
                  </div>
                </div>
                
                {fichaData.payments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Historial de pagos:</p>
                    <div className="text-xs max-h-36 overflow-y-auto border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Método</th>
                            <th className="text-right p-2">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fichaData.payments.map((payment, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">
                                {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-2">{payment.method}</td>
                              <td className="p-2 text-right">{formatCurrency(payment.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Legal Statement */}
            <div className="text-xs text-muted-foreground text-center mt-6 print:mt-10">
              <p>Osuna Fotografías agradece su preferencia.</p>
              <p>Esta ficha sirve como comprobante de su compra.</p>
            </div>
            
            {/* Print Button - Hide when printing */}
            <div className="flex justify-end mt-6 print:hidden">
              <Button
                onClick={handlePrintPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Imprimir Ficha
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 