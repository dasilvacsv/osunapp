"use client"

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Download,
  FileDigit,
  MessageCircle,
  Calendar,
  GraduationCap,
  Package
} from "lucide-react";
import { useRouter } from "next/navigation";
import { OrganizationSalesGroup, PurchaseStatus, PaymentStatus, CertificateStatus } from "./types";
import Link from "next/link";
import { sendFichaWhatsApp } from "./actions";
import { toast } from "sonner";

interface CertificadosTableProps {
  salesGroups: OrganizationSalesGroup[];
}

export function CertificadosTable({ salesGroups }: CertificadosTableProps) {
  const router = useRouter();
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialExpandedOrgs: Record<string, boolean> = {};
    salesGroups.forEach(group => {
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
    if (!type) return <Globe className="h-6 w-6 text-blue-500" />;
    
    switch (type) {
      case "SCHOOL":
        return <School className="h-6 w-6 text-indigo-500" />;
      case "COMPANY":
        return <Building2 className="h-6 w-6 text-emerald-500" />;
      default:
        return <Building className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PurchaseStatus) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1">Completado</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1">En Progreso</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1">Pendiente</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1">Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="font-medium px-3 py-1">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (isPaid: boolean | null, paymentStatus: PaymentStatus | null) => {
    if (isPaid === true) {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1">Pagado</Badge>;
    }
    
    if (paymentStatus === "PAID") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1">Pagado</Badge>;
    } else if (paymentStatus === "PENDING") {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1">Pendiente</Badge>;
    } else if (paymentStatus === "OVERDUE") {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1">Vencido</Badge>;
    } else if (paymentStatus === "CANCELLED") {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1">Cancelado</Badge>;
    }
    
    return <Badge variant="outline" className="font-medium px-3 py-1">Desconocido</Badge>;
  };

  const getCertificateStatusBadge = (status: CertificateStatus | null) => {
    if (!status) return <Badge variant="outline" className="font-medium px-3 py-1">No generado</Badge>;
    
    switch (status) {
      case "GENERATED":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1">Generado</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1">Aprobado</Badge>;
      case "NEEDS_REVISION":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1">Necesita revisión</Badge>;
      case "NOT_GENERATED":
      default:
        return <Badge variant="outline" className="font-medium px-3 py-1">No generado</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatAmountWithCurrency = (amount: number | string | null, currencyType: string) => {
    if (amount === null) return "N/A";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currencyType === "BS") {
      return (
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {`Bs. ${numAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(numAmount, "USD")}
          </div>
        </div>
      );
    }
  };

  const handleSendWhatsApp = async (purchaseId: string) => {
    try {
      const result = await sendFichaWhatsApp(purchaseId);
      if (result.success) {
        toast.success('Ficha enviada por WhatsApp', {
          duration: 3000,
        });
      } else {
        toast.error(result.error || 'Error al enviar la ficha', {
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Error al enviar la ficha', {
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-8">
      {salesGroups.length === 0 ? (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900">No se encontraron ventas</h3>
              <p className="text-gray-500">No hay registros de ventas disponibles en este momento.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        salesGroups.map(group => (
          <Card key={group.id || 'no-org'} className="overflow-hidden bg-white shadow-lg transition-all duration-200 hover:shadow-xl">
            <CardHeader className="p-0">
              <button
                onClick={() => toggleOrgExpansion(group.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gray-50">
                    {getOrganizationIcon(group.type)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{group.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Receipt className="h-4 w-4" />
                        {group.totalSales} venta{group.totalSales !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Total: {formatAmountWithCurrency(group.totalAmount, group.currencyType)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-medium px-3 py-1">
                    {group.totalSales} venta{group.totalSales !== 1 ? 's' : ''}
                  </Badge>
                  {expandedOrgs[group.id || 'no-org'] ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
            </CardHeader>
            
            {expandedOrgs[group.id || 'no-org'] && (
              <CardContent className="p-0">
                <div className="border-t border-gray-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="font-semibold">Beneficiario</TableHead>
                        <TableHead className="font-semibold">Grado/Sección</TableHead>
                        <TableHead className="font-semibold">Paquete</TableHead>
                        <TableHead className="font-semibold">Monto</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Pago</TableHead>
                        <TableHead className="font-semibold">Certificado</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.sales.map(sale => (
                        <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <Link
                                href={`/sales/${sale.id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                {sale.id.slice(-8)}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(sale.purchaseDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {sale.clientName || "Cliente desconocido"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              {sale.beneficiarioFirstName && sale.beneficiarioLastName ? (
                                <span className="font-medium text-gray-900">
                                  {`${sale.beneficiarioFirstName} ${sale.beneficiarioLastName}`}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">Sin beneficiario</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sale.beneficiarioGrade || sale.beneficiarioSection ? (
                              <span className="font-medium text-gray-900">
                                {`${sale.beneficiarioGrade || ""} ${sale.beneficiarioSection ? `- ${sale.beneficiarioSection}` : ""}`}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              {sale.bundleName ? (
                                <span className="font-medium text-gray-900">{sale.bundleName}</span>
                              ) : (
                                <span className="text-gray-500 text-sm">Sin paquete</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatAmountWithCurrency(sale.totalAmount, sale.currencyType)}
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
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-semibold">Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => router.push(`/certificados/${sale.id}/ficha`)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <FileDigit className="h-4 w-4" /> Ver Ficha PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/sales/${sale.id}`)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Receipt className="h-4 w-4" /> Ver venta
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {sale.certificateStatus === "GENERATED" ? (
                                  <>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                      onClick={() => router.push(`/certificados/${sale.id}/approve`)}
                                    >
                                      <CheckCircle className="h-4 w-4" /> Aprobar certificado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-amber-600 focus:text-amber-600 cursor-pointer"
                                      onClick={() => router.push(`/certificados/${sale.id}/revision`)}
                                    >
                                      <Edit className="h-4 w-4" /> Solicitar revisión
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => router.push(`/certificados/${sale.id}/generate`)}
                                  >
                                    <FileText className="h-4 w-4" /> Generar certificado
                                  </DropdownMenuItem>
                                )}
                                {sale.certificateFileUrl && (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => window.open(sale.certificateFileUrl || "", "_blank")}
                                  >
                                    <Download className="h-4 w-4" /> Descargar certificado
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {sale.isPaid || sale.paymentStatus === "PAID" ? (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                  >
                                    <XCircle className="h-4 w-4" /> Marcar como no pagado
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4" /> Marcar como pagado
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendWhatsApp(sale.id);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                                </DropdownMenuItem>
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