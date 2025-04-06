import type { Metadata } from "next"
import { getPurchaseDetails } from "@/features/inventory/stock/actions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Package, CreditCard, ArrowLeft, Calendar, Receipt } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PurchasePaymentButton } from "@/features/inventory/purchases/purchase-payment-button"
import { Suspense } from "react"

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Detalles de Compra #${params.id.slice(0, 8)}`,
    description: "Visualiza los detalles de una compra específica",
  }
}

// Componente para cargar los detalles de la compra
async function PurchaseDetails({ id }: { id: string }) {
  // Obtener detalles de la compra
  const purchaseResult = await getPurchaseDetails(id)

  if (!purchaseResult.success) {
    notFound()
  }

  const { purchase, items, payments } = purchaseResult.data

  const totalAmount = Number(purchase.totalAmount)
  const paidAmount = Number(purchase.paidAmount || 0)
  const pendingAmount = totalAmount - paidAmount

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Información de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Proveedor</p>
                <p className="font-medium">{purchase.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Factura</p>
                <p className="font-medium">{purchase.invoiceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(purchase.purchaseDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge
                  variant={
                    purchase.status === "PAID" ? "default" : purchase.status === "PARTIAL" ? "outline" : "secondary"
                  }
                  className={
                    purchase.status === "PARTIAL"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : purchase.status === "PENDING"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ""
                  }
                >
                  {purchase.status === "PAID" ? "Pagado" : purchase.status === "PARTIAL" ? "Pago Parcial" : "Pendiente"}
                </Badge>
              </div>
            </div>

            {purchase.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(purchase.dueDate)}
                </p>
              </div>
            )}

            {purchase.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm">{purchase.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pagado:</span>
                <span className="font-medium">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pendiente:</span>
                <span className={`font-medium ${pendingAmount > 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            </div>

            {pendingAmount > 0 && (
              <div className="pt-4">
                <PurchasePaymentButton purchaseId={purchase.id} totalAmount={totalAmount} paidAmount={paidAmount} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>
                          {payment.paymentMethod === "CASH"
                            ? "Efectivo"
                            : payment.paymentMethod === "TRANSFER"
                              ? "Transferencia"
                              : payment.paymentMethod === "CHECK"
                                ? "Cheque"
                                : "Otro"}
                        </TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay pagos registrados</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {purchase.status === "PAID"
                    ? "Esta compra fue pagada al contado."
                    : "Aún no se han registrado pagos para esta compra."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Comprados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo Unitario</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.item.name}</span>
                        <span className="text-xs text-muted-foreground">SKU: {item.item.sku || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.purchaseItem.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.purchaseItem.unitCost))}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.purchaseItem.totalCost))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function PurchaseDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalles de Compra</h1>
          <p className="text-muted-foreground">Información detallada de la compra #{params.id.slice(0, 8)}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/inventario/compras" prefetch={false} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Compras
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="py-10 text-center">Cargando detalles de la compra...</div>}>
        <PurchaseDetails id={params.id} />
      </Suspense>
    </div>
  )
}

