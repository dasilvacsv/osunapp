"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { CertificadoSale, PurchaseStatus, PaymentStatus } from "./types"
import { 
  MoreHorizontal, 
  Receipt,
  User,
  FileText,
  CheckCircle,
  XCircle
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

export const columns: ColumnDef<CertificadoSale>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id: string = row.getValue("id");
      return (
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span>{id.slice(-8)}</span>
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
      return formatCurrency(amount);
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
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" /> Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" /> Generar PDF
            </DropdownMenuItem>
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