import { getCertificadoSales } from "@/features/certificados/actions";
import { CertificadosTable } from "@/features/certificados/certificados-table";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import Link from "next/link";

export default async function CertificadosPage() {
  const result = await getCertificadoSales();
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificados y Ventas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de ventas y certificados por organización
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/certificados/export">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </Link>
          <Link href="/certificados/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Venta
            </Button>
          </Link>
        </div>
      </div>
      
      {result.success ? (
        <CertificadosTable salesGroups={result.data || []} />
      ) : (
        <div className="p-8 text-center">
          <p className="text-red-500">{result.error || "Error al cargar los datos de ventas"}</p>
        </div>
      )}
    </div>
  );
}