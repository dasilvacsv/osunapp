"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { getFichaData } from "@/features/certificados/actions";
import { FichaData } from "@/features/certificados/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Print styles
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      
      body {
        background: white !important;
      }
      
      .print-container {
        padding: 0;
        margin: 0;
        background: white;
        box-shadow: none;
      }
      
      .print-hidden {
        display: none !important;
      }
    }
  `}</style>
);

export default function FichaPage() {
  const params = useParams();
  const purchaseId = params.id as string;

  const [fichaData, setFichaData] = useState<FichaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getFichaData(purchaseId);
        if (result.success && result.data) {
          setFichaData(result.data);
        } else {
          setError(result.error || "Error al cargar los datos");
        }
      } catch (err) {
        console.error("Error loading ficha data:", err);
        setError("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [purchaseId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container py-6 space-y-6">
      <PrintStyles />
      <div className="flex justify-between items-center print-hidden">
        <Link href="/certificados">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Button onClick={handlePrint} className="gap-2">
          <Download className="h-4 w-4" />
          Imprimir Ficha
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando datos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-red-500">{error}</p>
          <Link href="/certificados" className="mt-4">
            <Button variant="outline">Volver a Certificados</Button>
          </Link>
        </div>
      ) : !fichaData ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">No se encontraron datos</p>
          <Link href="/certificados" className="mt-4">
            <Button variant="outline">Volver a Certificados</Button>
          </Link>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg print:shadow-none print-container">
          {/* Header with Logo and Title */}
          <div className="flex flex-col items-center mb-6 print:mb-8">
            <h1 className="text-2xl font-bold">Osuna Fotografías📸</h1>
            <p className="text-lg text-muted-foreground">Paquetes de Grado👨🏻‍🎓</p>
          </div>
          
          {/* Client Information */}
          <Card className="mb-6 print:shadow-none print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">DATOS DEL REPRESENTANTE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre y Apellido:</p>
                  <p className="font-medium">{fichaData.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">C.I:</p>
                  <p className="font-medium">{fichaData.clientDocument}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Celular ó Tlf:</p>
                  <p className="font-medium">{fichaData.clientPhone || fichaData.clientWhatsapp}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo Electrónico:</p>
                  <p className="font-medium">{fichaData.clientEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Student Information */}
          <Card className="mb-6 print:shadow-none print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">DATOS DEL ALUMNO 👨‍🎓</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fichaData.beneficiarioName ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Apellidos del alumno:</p>
                      <p className="font-medium">{fichaData.beneficiarioLastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombres del alumno:</p>
                      <p className="font-medium">{fichaData.beneficiarioFirstName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre del Colegio:</p>
                    <p className="font-medium">{fichaData.beneficiarioSchool || fichaData.organizationName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nivel:</p>
                      <p className="font-medium">{fichaData.beneficiarioGrade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sección:</p>
                      <p className="font-medium">{fichaData.beneficiarioSection}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground italic">No hay datos del alumno registrados</p>
              )}
            </CardContent>
          </Card>
          
          {/* Payment Information */}
          <Card className="mb-6 print:shadow-none print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">INFORMACIÓN DE PAGO 🧾</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Costo del Paquete:</p>
                  <p className="font-medium">{formatCurrency(fichaData.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo adicionales:</p>
                  <p className="font-medium">{formatCurrency(0)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Abono de:</p>
                  <p className="font-medium">{formatCurrency(fichaData.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resta:</p>
                  <p className="font-medium text-red-500">{formatCurrency(fichaData.remaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bundle Items */}
          {fichaData.bundleItems.length > 0 && (
            <div className="mt-6 mb-6">
              <h3 className="font-medium mb-2">El paquete incluye:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {fichaData.bundleItems.map((item, idx) => (
                  <li key={idx}>
                    {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-8 text-center border-t pt-4">
            <p className="text-sm text-muted-foreground">Osuna Fotografías agradece su preferencia</p>
            <p className="text-xs text-muted-foreground mt-1">Esta ficha sirve como comprobante de su compra.</p>
          </div>
        </div>
      )}
    </div>
  );
} 