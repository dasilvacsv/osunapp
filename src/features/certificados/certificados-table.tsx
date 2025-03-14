"use client"

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  MoreHorizontal, 
  School, 
  Building2, 
  ChevronDown,
  ChevronRight,
  Building,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Receipt,
  User,
  Edit,
  Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrganizationSalesGroup, PurchaseStatus, PaymentStatus, CertificateStatus } from "./types";
import Link from "next/link";

interface CertificadosTableProps {
  salesGroups: OrganizationSalesGroup[];
}

export function CertificadosTable({ salesGroups }: CertificadosTableProps) {
  console.log(salesGroups);
  
  const router = useRouter();
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  // Initialize expanded state for organizations
  useEffect(() => {
    const initialExpandedOrgs: Record<string, boolean> = {};
    salesGroups.forEach(group => {
      // Expand the first organization by default, or if there's only one
      initialExpandedOrgs[group.id || 'no-org'] = salesGroups.length === 1;
    });
    setExpandedOrgs(initialExpandedOrgs);
  }, [salesGroups]);

  const toggleOrgExpansion = (orgId: string | null) => {
    const key = orgId || 'no-org';
    setExpandedOrgs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getOrganizationIcon = (type: string | null) => {
    if (!type) return <Globe className="h-5 w-5" />;
    
    switch (type) {
      case "SCHOOL":
        return <School className="h-5 w-5" />;
      case "COMPANY":
        return <Building2 className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: PurchaseStatus) => {
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
  };

  const getPaymentStatusBadge = (isPaid: boolean | null, paymentStatus: PaymentStatus | null) => {
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
  };

  const getCertificateStatusBadge = (status: CertificateStatus | null) => {
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
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {salesGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No se encontraron ventas.
          </CardContent>
        </Card>
      ) : (
        salesGroups.map(group => (
          <Card key={group.id || 'no-org'} className="overflow-hidden">
            <button
              onClick={() => toggleOrgExpansion(group.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getOrganizationIcon(group.type)}
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.totalSales} venta{group.totalSales !== 1 ? 's' : ''} | Total: {formatCurrency(group.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {group.totalSales} venta{group.totalSales !== 1 ? 's' : ''}
                </Badge>
                {expandedOrgs[group.id || 'no-org'] ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
            
            {expandedOrgs[group.id || 'no-org'] && (
              <CardContent className="p-0">
                <div className="rounded-md border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Beneficiario</TableHead>
                        <TableHead>Grado/Sección</TableHead>
                        <TableHead>Paquete</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Certificado</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.sales.map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <Link
                                href={`/sales/${sale.id}`}
                                className="hover:underline text-blue-600"
                              >
                                {sale.id.slice(-8)}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(sale.purchaseDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {sale.clientName || "Cliente desconocido"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sale.beneficiarioFirstName && sale.beneficiarioLastName ? (
                              `${sale.beneficiarioFirstName} ${sale.beneficiarioLastName}`
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin beneficiario</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sale.beneficiarioGrade || sale.beneficiarioSection ? (
                              `${sale.beneficiarioGrade || ""} ${sale.beneficiarioSection ? `- ${sale.beneficiarioSection}` : ""}`
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sale.bundleName || (
                              <span className="text-muted-foreground text-sm">Sin paquete</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(sale.totalAmount || 0))}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sale.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(sale.isPaid, sale.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getCertificateStatusBadge(sale.certificateStatus)}
                          </TableCell>
                          <TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => router.push(`/certificados/${sale.id}`)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" /> Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/certificados/${sale.id}/pdf`)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" /> Generar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/sales/${sale.id}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Receipt className="h-4 w-4" /> Ver venta
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {sale.certificateStatus === "GENERATED" ? (
                                  <>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                      onClick={() => router.push(`/certificados/${sale.id}/approve`)}
                                    >
                                      <CheckCircle className="h-4 w-4" /> Aprobar certificado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-yellow-600 focus:text-yellow-600"
                                      onClick={() => router.push(`/certificados/${sale.id}/revision`)}
                                    >
                                      <Edit className="h-4 w-4" /> Solicitar revisión
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => router.push(`/certificados/${sale.id}/generate`)}
                                  >
                                    <FileText className="h-4 w-4" /> Generar certificado
                                  </DropdownMenuItem>
                                )}
                                {sale.certificateFileUrl && (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => window.open(sale.certificateFileUrl || "", "_blank")}
                                  >
                                    <Download className="h-4 w-4" /> Descargar certificado
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {sale.isPaid || sale.paymentStatus === "PAID" ? (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                  >
                                    <XCircle className="h-4 w-4" /> Marcar como no pagado
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4" /> Marcar como pagado
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
} 