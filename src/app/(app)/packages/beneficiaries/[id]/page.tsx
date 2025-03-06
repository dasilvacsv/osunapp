import { getBeneficiaryDetails } from "@/features/packages/actions"
import { Button } from "@/components/ui/button"
import { Package2, User, Calendar, DollarSign, School, Users, ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <User className="w-6 h-6 text-primary" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Información Personal
            </CardTitle>
            <CardDescription>Datos del beneficiario del paquete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Nombre completo</h3>
                <p className="font-medium">
                  {beneficiary.firstName} {beneficiary.lastName}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Colegio</h3>
                <p className="font-medium">{beneficiary.school}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Nivel</h3>
                <Badge variant="outline" className="font-normal">
                  {beneficiary.level}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sección</h3>
                <Badge variant="outline" className="font-normal">
                  {beneficiary.section}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado</h3>
              <Badge variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}>
                {beneficiary.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de registro</h3>
              <p className="flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(beneficiary.createdAt).toLocaleDateString()}
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
                  {formatCurrency(bundle.basePrice)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                <Badge variant="outline">
                  {bundle.type === "SCHOOL_PACKAGE"
                    ? "Escolar"
                    : bundle.type === "ORGANIZATION_PACKAGE"
                      ? "Organizacional"
                      : "Regular"}
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
                      >
                        {purchase.status === "COMPLETED"
                          ? "Completado"
                          : purchase.status === "CANCELLED"
                            ? "Cancelado"
                            : purchase.status === "PENDING"
                              ? "Pendiente"
                              : purchase.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Fecha de compra</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Método de pago</p>
                      <Badge variant="outline">
                        {purchase.paymentMethod === "CASH"
                          ? "Efectivo"
                          : purchase.paymentMethod === "CARD"
                            ? "Tarjeta"
                            : purchase.paymentMethod === "TRANSFER"
                              ? "Transferencia"
                              : purchase.paymentMethod}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Monto total</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(purchase.totalAmount)}</p>
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

