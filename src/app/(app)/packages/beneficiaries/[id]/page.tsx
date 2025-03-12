import type React from "react"
import { getBeneficiaryDetails } from "@/features/packages/actions"
import { Button } from "@/components/ui/button"
import {
  Package2,
  User,
  Calendar,
  DollarSign,
  School,
  Users,
  ArrowLeft,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  GraduationCap,
  UserCircle,
  AlertCircle,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { BundleType, PurchaseStatus, PaymentMethod } from "@/features/packages/types"
import { getOrganizationSections } from "@/app/(app)/organizations/organization"
import { ExportButton } from "@/features/packages/export-button"

// Helper function to safely format dates
const formatDate = (date: Date | string | null): string => {
  if (!date) return "N/A"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

const statusIcons: Record<PurchaseStatus, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  CANCELLED: <XCircle className="w-4 h-4 text-red-500" />,
  APPROVED: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  IN_PROGRESS: <Clock className="w-4 h-4 text-orange-500" />,
}

const statusLabels: Record<PurchaseStatus, string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En Proceso",
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  CASH: <DollarSign className="w-4 h-4" />,
  CARD: <CreditCard className="w-4 h-4" />,
  TRANSFER: <ShoppingCart className="w-4 h-4" />,
  OTHER: <AlertCircle className="w-4 h-4" />,
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
}

const bundleTypeLabels: Record<BundleType, string> = {
  SCHOOL_PACKAGE: "Escolar",
  ORGANIZATION_PACKAGE: "Organizacional",
  REGULAR: "Regular",
}

const templateStatusLabels: Record<string, string> = {
  COMPLETE: "Completa",
  INCOMPLETE: "Incompleta",
  PENDING: "Pendiente",
}

const templateStatusColors: Record<string, string> = {
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INCOMPLETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
}

export default async function BeneficiaryDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getBeneficiaryDetails(params.id)

  if (!result.success || !result.data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 flex items-center gap-3">
          <div className="bg-destructive/20 p-2 rounded-full">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Beneficiario no encontrado</h2>
            <p className="text-sm">No se pudo encontrar el beneficiario solicitado</p>
          </div>
        </div>

        <div className="mt-4">
          <Link href="/packages">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver a paquetes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { beneficiary, bundle, purchase } = result.data

  // Check if beneficiary data is complete
  const isDataComplete =
    beneficiary.firstName && beneficiary.lastName && beneficiary.school && beneficiary.level && beneficiary.section

  // Get organization sections if available
  let organizationSections: { level: string; templateStatus: string; templateLink?: string }[] = []
  if (beneficiary.organizationId) {
    const sectionsResult = await getOrganizationSections(beneficiary.organizationId)
    if (sectionsResult.data) {
      organizationSections = sectionsResult.data.map((section) => ({
        ...section,
        templateLink: section.templateLink || undefined,
        templateStatus: section.templateStatus || "INCOMPLETE",
      }))
    }
  }

  // Find matching section template if available
  const matchingSection = organizationSections.find((section) => section.level === beneficiary.level)

  if (!bundle) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4">
          <h2 className="font-semibold">Paquete no encontrado</h2>
          <p className="text-sm">El beneficiario no tiene un paquete asignado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {beneficiary.firstName} {beneficiary.lastName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <School className="w-4 h-4" />
              {beneficiary.school}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton beneficiaryId={params.id} variant="outline" title="Exportar Datos" />

          <Link href={`/packages/${bundle.id}`}>
            <Button variant="outline" className="gap-2">
              <Package2 className="w-4 h-4" />
              Ver Paquete
            </Button>
          </Link>

          {purchase && (
            <Link href={`/sales/${purchase.id}`}>
              <Button variant="default" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Ver Compra
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!isDataComplete && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 dark:bg-red-900/10 dark:border-red-800/30">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <h2 className="font-semibold text-red-700 dark:text-red-400">Datos incompletos</h2>
            <p className="text-sm text-red-600 dark:text-red-300">
              Este beneficiario tiene información incompleta. Por favor complete todos los campos.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={!isDataComplete ? "border-red-200 bg-red-50/50 dark:bg-red-900/5 dark:border-red-800/30" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Información Personal
              {!isDataComplete && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ml-2">Incompleto</Badge>
              )}
            </CardTitle>
            <CardDescription>Datos del beneficiario del paquete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Nombre completo</h3>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {beneficiary.firstName} {beneficiary.lastName}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Colegio</h3>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {beneficiary.school}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Nivel</h3>
                <Badge variant="outline" className="font-normal flex w-fit items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {beneficiary.level}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sección</h3>
                <Badge variant="outline" className="font-normal flex w-fit items-center gap-1">
                  <Users className="w-3 h-3" />
                  {beneficiary.section}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado</h3>
              <Badge
                variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}
                className="flex w-fit items-center gap-1"
              >
                {beneficiary.status === "ACTIVE" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {beneficiary.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            {matchingSection && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Plantilla de Sección</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`${templateStatusColors[matchingSection.templateStatus]}`}>
                      {templateStatusLabels[matchingSection.templateStatus]}
                    </Badge>

                    {matchingSection.templateLink && (
                      <a
                        href={matchingSection.templateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Ver plantilla
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de registro</h3>
              <p className="flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {formatDate(beneficiary.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="w-5 h-5 text-primary" />
              Detalles del Paquete
            </CardTitle>
            <CardDescription>Información del paquete asignado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Paquete</h3>
              <p className="font-medium flex items-center gap-2">
                <Package2 className="w-4 h-4 text-muted-foreground" />
                {bundle.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Precio base</h3>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  {formatCurrency(Number(bundle.basePrice))}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                <Badge variant="outline" className="flex w-fit items-center gap-1">
                  <Package2 className="w-3 h-3" />
                  {bundleTypeLabels[bundle.type]}
                </Badge>
              </div>
            </div>

            {purchase && (
              <>
                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Detalles de compra</h3>

                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge
                        variant={
                          purchase.status === "COMPLETED"
                            ? "success"
                            : purchase.status === "CANCELLED"
                              ? "destructive"
                              : "default"
                        }
                        className="flex items-center gap-1"
                      >
                        {statusIcons[purchase.status]}
                        {statusLabels[purchase.status]}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Fecha de compra</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(purchase.purchaseDate)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Método de pago</p>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {paymentMethodIcons[purchase.paymentMethod as PaymentMethod]}
                        {paymentMethodLabels[purchase.paymentMethod as PaymentMethod]}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Monto total</p>
                      <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(Number(purchase.totalAmount))}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

