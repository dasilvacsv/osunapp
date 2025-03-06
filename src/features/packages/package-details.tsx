"use client";

import type React from "react"
import type { BundleWithBeneficiaries, BundleType, PurchaseStatus, PaymentMethod } from "@/features/packages/types"
import { addBundleBeneficiary, removeBundleBeneficiary } from "@/features/packages/actions"
import { useState } from "react"
import {
  Package2,
  UserPlus,
  X,
  Calendar,
  DollarSign,
  ShoppingCart,
  School,
  Users,
  Tag,
  Percent,
  AlertCircle,
  Search,
  Edit,
  Trash2,
  User,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

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

const typeLabels: Record<BundleType, string> = {
  SCHOOL_PACKAGE: "Escolar",
  ORGANIZATION_PACKAGE: "Organizacional",
  REGULAR: "Regular",
}

const statusIcons: Record<PurchaseStatus, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  APPROVED: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  IN_PROGRESS: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  CANCELLED: <XCircle className="w-4 h-4 text-red-500" />,
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

const statusLabels: Record<PurchaseStatus, string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En Proceso",
  CANCELLED: "Cancelado",
}

const statusColors: Record<PurchaseStatus, string> = {
  COMPLETED: "bg-green-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-blue-500",
  IN_PROGRESS: "bg-orange-500",
  CANCELLED: "bg-red-500",
}

export function PackageDetails({ bundle }: { bundle: BundleWithBeneficiaries }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    school: "",
    level: "",
    section: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addBundleBeneficiary(bundle.id, formData)
      if (result.success) {
        setShowForm(false)
        setFormData({
          firstName: "",
          lastName: "",
          school: "",
          level: "",
          section: "",
        })
      }
    } catch (error) {
      console.error("Error al agregar beneficiario:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBeneficiary = async (id: string) => {
    try {
      await removeBundleBeneficiary(id)
      setConfirmDelete(null)
    } catch (error) {
      console.error("Error al eliminar beneficiario:", error)
    }
  }

  const filteredBeneficiaries = bundle.beneficiaries.filter((beneficiary) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      beneficiary.firstName.toLowerCase().includes(searchLower) ||
      beneficiary.lastName.toLowerCase().includes(searchLower) ||
      beneficiary.school.toLowerCase().includes(searchLower) ||
      beneficiary.level.toLowerCase().includes(searchLower) ||
      beneficiary.section.toLowerCase().includes(searchLower)
    )
  })

  const completedSales = bundle.salesData?.sales?.filter((sale) => sale.status === "COMPLETED") || []
  const averageSaleAmount = completedSales.length > 0
    ? bundle.salesData?.totalRevenue ? bundle.salesData.totalRevenue / completedSales.length : 0
    : 0

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Package2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{bundle.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-normal">
                {typeLabels[bundle.type]}
              </Badge>
              <Badge variant={bundle.status === "ACTIVE" ? "default" : "secondary"}>
                {bundle.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
              {bundle.categoryName && (
                <Badge variant="outline" className="bg-primary/5">
                  {bundle.categoryName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </Button>
          <Button variant="default" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package2 className="w-4 h-4" />
            <span className="hidden sm:inline">Información General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="beneficiaries" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Beneficiarios</span>
            <span className="sm:hidden">Benef.</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Historial de Ventas</span>
            <span className="sm:hidden">Ventas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="w-5 h-5 text-primary" />
                  Detalles del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundle.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h3>
                    <p className="text-foreground">{bundle.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Precio Base</h3>
                    <p className="text-xl font-semibold text-foreground flex items-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      {formatCurrency(bundle.basePrice)}
                    </p>
                  </div>

                  {bundle.discountPercentage && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Descuento</h3>
                      <p className="text-xl font-semibold text-green-500 flex items-center">
                        <Percent className="w-5 h-5" />
                        {bundle.discountPercentage}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Estadísticas de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Ventas</h3>
                    <p className="text-xl font-semibold text-foreground">{completedSales.length}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Ingresos Totales</h3>
                    <p className="text-xl font-semibold text-green-500">
                      {bundle.salesData ? formatCurrency(bundle.salesData.totalRevenue) : "N/A"}
                    </p>
                  </div>
                </div>

                {bundle.salesData?.lastSaleDate && (
                  <p className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {formatDate(bundle.salesData.lastSaleDate)}
                  </p>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Beneficiarios</h3>
                  <p className="flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {bundle.beneficiaries.length} beneficiario{bundle.beneficiaries.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Productos Incluidos
              </CardTitle>
              <CardDescription>
                Este paquete incluye {bundle.items?.length || 0} producto{bundle.items?.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bundle.items || bundle.items.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No hay productos incluidos en este paquete</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bundle.items.map((item, index) => (
                    <motion.div
                      key={item.item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-3 rounded-md border bg-muted/30 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.overridePrice || item.item.basePrice)}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficiaries" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Beneficiarios
                </CardTitle>
                <CardDescription>
                  {bundle.beneficiaries.length} beneficiario{bundle.beneficiaries.length !== 1 ? "s" : ""} registrado
                  {bundle.beneficiaries.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>

              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar beneficiarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-muted/50 p-4 rounded-lg border space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Nuevo Beneficiario</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombres</Label>
                        <Input
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Nombres del beneficiario"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Apellidos del beneficiario"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school">Colegio</Label>
                        <Input
                          id="school"
                          required
                          value={formData.school}
                          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                          placeholder="Nombre del colegio"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">Nivel</Label>
                        <Input
                          id="level"
                          required
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          placeholder="Nivel educativo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Sección</Label>
                        <Input
                          id="section"
                          required
                          value={formData.section}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          placeholder="Sección o aula"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <span className="mr-2">Guardando</span>
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {filteredBeneficiaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p>No se encontraron beneficiarios con "{searchTerm}"</p>
                    </>
                  ) : (
                    <>
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No hay beneficiarios registrados</p>
                      <p className="text-sm mt-1">Agrega un beneficiario para comenzar</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredBeneficiaries.map((beneficiary) => (
                      <motion.div
                        key={beneficiary.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-card border rounded-lg hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1 mb-2 sm:mb-0">
                          <p className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {beneficiary.firstName} {beneficiary.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <School className="w-3 h-3" />
                            {beneficiary.school} - {beneficiary.level} {beneficiary.section}
                          </p>

                          {beneficiary.purchase?.purchaseDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Compra: {formatDate(beneficiary.purchase.purchaseDate)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Link href={`/packages/beneficiaries/${beneficiary.id}`}>
                            <Button variant="outline" size="sm" className="h-8">
                              Ver detalles
                            </Button>
                          </Link>

                          <Dialog
                            open={confirmDelete === beneficiary.id}
                            onOpenChange={(open) => !open && setConfirmDelete(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => setConfirmDelete(beneficiary.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmar eliminación</DialogTitle>
                                <DialogDescription>
                                  ¿Estás seguro de que deseas eliminar a este beneficiario? Esta acción no se puede
                                  deshacer.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                                  Cancelar
                                </Button>
                                <Button variant="destructive" onClick={() => handleRemoveBeneficiary(beneficiary.id)}>
                                  Eliminar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Historial de Ventas
              </CardTitle>
              <CardDescription>Registro de todas las ventas realizadas de este paquete</CardDescription>
            </CardHeader>
            <CardContent>
              {completedSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                  <p>No hay ventas registradas para este paquete</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{completedSales.length}</div>
                        <p className="text-sm text-muted-foreground">Ventas completadas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(bundle.salesData?.totalRevenue || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Ingresos totales</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatCurrency(averageSaleAmount)}
                        </div>
                        <p className="text-sm text-muted-foreground">Promedio por venta</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-6 gap-4 p-4 bg-muted text-sm font-medium text-muted-foreground">
                      <div className="col-span-2">Cliente</div>
                      <div>Fecha</div>
                      <div>Estado</div>
                      <div>Método</div>
                      <div className="text-right">Monto</div>
                    </div>

                    <div className="divide-y">
                      {bundle.salesData?.sales?.map((sale, index) => (
                        <motion.div
                          key={sale.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="grid grid-cols-6 gap-4 p-4 items-center text-sm hover:bg-muted/50 transition-colors"
                        >
                          <div className="col-span-2">
                            <p className="font-medium">{sale.clientName}</p>
                            <p className="text-xs text-muted-foreground">{sale.beneficiaryName}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(sale.purchaseDate)}
                          </div>
                          <div>
                            <Badge
                              variant="secondary"
                              className="flex w-fit items-center gap-1 font-normal"
                              style={{
                                backgroundColor: `${statusColors[sale.status]}10`,
                                color: statusColors[sale.status],
                              }}
                            >
                              {statusIcons[sale.status]}
                              {statusLabels[sale.status]}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                              {paymentMethodIcons[sale.paymentMethod]}
                              {paymentMethodLabels[sale.paymentMethod]}
                            </Badge>
                          </div>
                          <div className="text-right font-medium">{formatCurrency(sale.amount)}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}