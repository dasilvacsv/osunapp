"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { CertificadoSale, PurchaseStatus, PaymentStatus, CertificateStatus } from "./types"
import { 
  MoreHorizontal, 
  Receipt,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  FileDigit
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { FichaTrigger } from "./ficha-pdf"

export const columns: ColumnDef<CertificadoSale>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id: string = row.getValue("id");
      return (
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <Link href={`/sales/${id}`} className="hover:underline text-blue-600">
            {id.slice(-8)}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => {
      const date: Date | null = row.getValue("purchaseDate");
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    },
  },
  {
    accessorKey: "clientName",
    header: "Cliente",
    cell: ({ row }) => {
      const clientName: string | null = row.getValue("clientName");
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {clientName || "Cliente desconocido"}
        </div>
      );
    },
  },
  {
    id: "beneficiario",
    header: "Beneficiario",
    cell: ({ row }) => {
      const firstName = row.original.beneficiarioFirstName;
      const lastName = row.original.beneficiarioLastName;
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      
      return <span className="text-muted-foreground text-sm">Sin beneficiario</span>;
    },
  },
  {
    id: "gradeSection",
    header: "Grado/Sección",
    cell: ({ row }) => {
      const grade = row.original.beneficiarioGrade;
      const section = row.original.beneficiarioSection;
      
      if (grade || section) {
        return `${grade || ""} ${section ? `- ${section}` : ""}`;
      }
      
      return <span className="text-muted-foreground text-sm">N/A</span>;
    },
  },
  {
    accessorKey: "bundleName",
    header: "Paquete",
    cell: ({ row }) => {
      const bundleName: string | null = row.getValue("bundleName");
      return bundleName || <span className="text-muted-foreground text-sm">Sin paquete</span>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Monto",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount") || "0");
      const currencyType = row.original.currencyType || "USD";
      return formatCurrency(amount, currencyType);
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status: PurchaseStatus = row.getValue("status");
      
      switch (status) {
        case "COMPLETED":
          return <Badge className="bg-green-500 hover:bg-green-600">Completado</Badge>;
        case "IN_PROGRESS":
          return <Badge className="bg-blue-500 hover:bg-blue-600">En Progreso</Badge>;
        case "PENDING":
          return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
        case "CANCELLED":
          return <Badge className="bg-red-500 hover:bg-red-600">Cancelado</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    },
  },
  {
    id: "paymentStatus",
    header: "Pago",
    cell: ({ row }) => {
      const isPaid = row.original.isPaid;
      const paymentStatus = row.original.paymentStatus;
      
      if (isPaid === true) {
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      }
      
      if (paymentStatus === "PAID") {
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      } else if (paymentStatus === "PENDING") {
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      } else if (paymentStatus === "OVERDUE") {
        return <Badge className="bg-red-500 hover:bg-red-600">Vencido</Badge>;
      } else if (paymentStatus === "CANCELLED") {
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelado</Badge>;
      }
      
      return <Badge variant="outline">Desconocido</Badge>;
    },
  },
  {
    id: "certificateStatus",
    header: "Certificado",
    cell: ({ row }) => {
      const status = row.original.certificateStatus;
      
      if (!status) return <Badge variant="outline">No generado</Badge>;
      
      switch (status) {
        case "GENERATED":
          return <Badge className="bg-blue-500 hover:bg-blue-600">Generado</Badge>;
        case "APPROVED":
          return <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>;
        case "NEEDS_REVISION":
          return <Badge className="bg-yellow-500 hover:bg-yellow-600">Necesita revisión</Badge>;
        case "NOT_GENERATED":
        default:
          return <Badge variant="outline">No generado</Badge>;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/certificados/${sale.id}`} className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Ver detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/certificados/${sale.id}/pdf`} className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Generar PDF
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FichaTrigger purchaseId={sale.id}>
                <div className="flex items-center gap-2 w-full">
                  <FileDigit className="h-4 w-4" /> Generar Ficha
                </div>
              </FichaTrigger>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/certificados/${sale.id}/ficha`} className="flex items-center gap-2">
                <FileDigit className="h-4 w-4" /> Ver Ficha PDF
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sales/${sale.id}`} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Ver venta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {sale.certificateStatus === "GENERATED" ? (
              <>
                <DropdownMenuItem asChild>
                  <Link 
                    href={`/certificados/${sale.id}/approve`} 
                    className="flex items-center gap-2 text-green-600 focus:text-green-600"
                  >
                    <CheckCircle className="h-4 w-4" /> Aprobar certificado
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href={`/certificados/${sale.id}/revision`}
                    className="flex items-center gap-2 text-yellow-600 focus:text-yellow-600"
                  >
                    <Edit className="h-4 w-4" /> Solicitar revisión
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href={`/certificados/${sale.id}/generate`} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Generar certificado
                </Link>
              </DropdownMenuItem>
            )}
            {sale.certificateFileUrl && (
              <DropdownMenuItem 
                onClick={() => window.open(sale.certificateFileUrl || "", "_blank")}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Descargar certificado
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {sale.isPaid || sale.paymentStatus === "PAID" ? (
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <XCircle className="h-4 w-4 mr-2" /> Marcar como no pagado
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-green-600 focus:text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" /> Marcar como pagado
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
] 