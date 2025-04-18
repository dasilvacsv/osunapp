"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getBundles, deleteBundle, cloneBundle } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  Package,
  DollarSign,
  Coins,
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
  AlignLeft,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  ChevronRight,
  Info,
  Tag,
  Percent,
  Trash2,
  AlertTriangle,
  Lock,
  Copy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BundleWithItems } from "../types"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function BundlesList() {
  const [groupedBundles, setGroupedBundles] = useState<Record<string, BundleWithItems[]>>({})
  const [loading, setLoading] = useState(true)
  const [openBundleId, setOpenBundleId] = useState<string | null>(null)
  const { toast } = useToast()
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null)
  const [bundleToDeleteName, setBundleToDeleteName] = useState<string>("")
  const [authCode, setAuthCode] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  // Nuevos estados para clonación
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const [bundleToClone, setBundleToClone] = useState<BundleWithItems | null>(null)
  const [newBundleName, setNewBundleName] = useState("")
  const [isCloning, setIsCloning] = useState(false)
  const [cloneError, setCloneError] = useState<string | null>(null)

  const toggleDescription = (bundleId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [bundleId]: !prev[bundleId],
    }))
  }

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const result = await getBundles()
      if (result.success && result.data) {
        const grouped = result.data.reduce((acc: Record<string, BundleWithItems[]>, bundle) => {
          const orgName = bundle.organization?.name || "Sin Organización"
          if (!acc[orgName]) acc[orgName] = []
          acc[orgName].push(bundle)
          return acc
        }, {})
        setGroupedBundles(grouped)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron cargar los paquetes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching bundles:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los paquetes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [])

  const formatBundleCurrency = (amount: number, currencyType?: string, conversionRate?: number) => {
    if (currencyType === "BS") {
      return `${amount.toFixed(2)} Bs`
    }
    return formatCurrency(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openDeleteDialog = (bundleId: string, bundleName: string) => {
    setBundleToDelete(bundleId)
    setBundleToDeleteName(bundleName)
    setAuthCode("")
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  const handleCloneBundle = async () => {
    if (!bundleToClone) return
  
    try {
      setIsCloning(true)
      setCloneError(null)
  
      // Usamos directamente la server action
      const result = await cloneBundle(bundleToClone.id, newBundleName)
  
      if (result.success) {
        toast({
          title: "Paquete clonado",
          description: "El paquete ha sido clonado exitosamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        setIsCloneDialogOpen(false)
        fetchBundles()
      } else {
        setCloneError(result.error || "Error al clonar el paquete")
      }
    } catch (error) {
      console.error("Error cloning bundle:", error)
      setCloneError("Ocurrió un error al clonar el paquete")
    } finally {
      setIsCloning(false)
    }
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setBundleToDelete(null)
    setBundleToDeleteName("")
    setAuthCode("")
    setDeleteError(null)
  }

  const handleDeleteBundle = async () => {
    if (!bundleToDelete) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const result = await deleteBundle(bundleToDelete, authCode)

      if (result.success) {
        toast({
          title: "Paquete eliminado",
          description: "El paquete ha sido eliminado exitosamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        closeDeleteDialog()
        fetchBundles()
      } else {
        setDeleteError(result.error || "Error al eliminar el paquete")
      }
    } catch (error) {
      console.error("Error deleting bundle:", error)
      setDeleteError("Ocurrió un error al eliminar el paquete")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando paquetes...</p>
        </div>
      </div>
    )
  }

  if (Object.keys(groupedBundles).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-primary/10 dark:bg-primary/5 p-6 rounded-full mb-6">
          <Package className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-3">No hay paquetes disponibles</h3>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Crea tu primer paquete usando la pestaña "Crear Nuevo Paquete" para comenzar a organizar tus productos.
        </p>
        <Link href="/inventario/bundles/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Nuevo Paquete
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {Object.entries(groupedBundles).map(([organization, bundles]) => (
        <div key={organization} className="space-y-6">
          <div className="flex items-center gap-3 border-b pb-3 dark:border-border/30">
            <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              {organization}
              <Badge variant="secondary" className="ml-3 text-xs font-normal">
                {bundles.length} {bundles.length === 1 ? "Paquete" : "Paquetes"}
              </Badge>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <Card
                key={bundle.id}
                className="overflow-hidden flex flex-col border border-border/60 dark:border-border/30 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {bundle.currencyType === "BS" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          Bs
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          USD
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-primary/10 text-primary font-medium dark:bg-primary/20">
                        {formatBundleCurrency(
                          bundle.totalDiscountedPrice,
                          bundle.currencyType,
                          Number(bundle.conversionRate),
                        )}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          openDeleteDialog(bundle.id, bundle.name)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        onClick={(e) => {
                          e.preventDefault()
                          setBundleToClone(bundle)
                          setNewBundleName(`${bundle.name} (Copia)`)
                          setCloneError(null)
                          setIsCloneDialogOpen(true)
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/inventario/bundles/edit/${bundle.id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div>
                    <CardTitle className="text-xl font-bold">{bundle.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(new Date(bundle.createdAt))}</span>
                      <Clock className="h-3.5 w-3.5 ml-2" />
                      <span>{formatTime(new Date(bundle.createdAt))}</span>
                    </div>
                  </div>

                  {bundle.description && (
                    <div className="mt-1 bg-muted/50 dark:bg-muted/20 p-3 rounded-md">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <AlignLeft className="h-4 w-4 text-primary" />
                        <span>Descripción</span>
                      </div>
                      <div className="relative">
                        <div
                          className={`${
                            !expandedDescriptions[bundle.id] && bundle.description.length > 150
                              ? "max-h-[80px] overflow-hidden"
                              : ""
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line text-muted-foreground">{bundle.description}</p>
                        </div>

                        {bundle.description.length > 150 && (
                          <>
                            {!expandedDescriptions[bundle.id] && (
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/50 to-transparent dark:from-muted/30 pointer-events-none"></div>
                            )}

                            <div className="relative mt-2 z-10">
                              <button
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer py-1 px-2 rounded-md hover:bg-primary/5 transition-colors bg-background/80 dark:bg-background/50"
                                onClick={() => toggleDescription(bundle.id)}
                              >
                                {expandedDescriptions[bundle.id] ? "Ver menos" : "Ver más"}
                                <ChevronRight
                                  className={`h-3 w-3 transition-transform ${expandedDescriptions[bundle.id] ? "rotate-90" : ""}`}
                                />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pb-3 flex-grow space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Precio base</span>
                      <span className="font-semibold">
                        {formatBundleCurrency(
                          bundle.totalBasePrice,
                          bundle.currencyType,
                          Number(bundle.conversionRate),
                        )}
                      </span>
                    </div>

                    <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Ganancia</span>
                      <span className="font-semibold">
                        {formatBundleCurrency(
                          Number(bundle.discountPercentage),
                          bundle.currencyType,
                          Number(bundle.conversionRate),
                        )}
                      </span>
                    </div>

                    <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Precio venta</span>
                      <span className="font-semibold text-primary">
                        {formatBundleCurrency(
                          bundle.totalDiscountedPrice,
                          bundle.currencyType,
                          Number(bundle.conversionRate),
                        )}
                      </span>
                    </div>

                    <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Productos</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{bundle.items.length}</span>
                        <span className="text-xs text-muted-foreground">
                          ({bundle.items.reduce((sum, item) => sum + item.quantity, 0)} unidades)
                        </span>
                      </div>
                    </div>
                  </div>

                  {bundle.notes && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md dark:bg-amber-900/20 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1 text-amber-800 dark:text-amber-400">
                        <FileText className="h-4 w-4" />
                        <span>Notas</span>
                      </div>
                      <p className="text-sm whitespace-pre-line text-amber-700 dark:text-amber-300">{bundle.notes}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  <Collapsible
                    open={openBundleId === bundle.id}
                    onOpenChange={(isOpen) => setOpenBundleId(isOpen ? bundle.id : null)}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-border/60 dark:border-border/30 mt-2 hover:bg-muted/50 dark:hover:bg-muted/20"
                      >
                        {openBundleId === bundle.id ? (
                          <ChevronUp className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        {openBundleId === bundle.id ? "Ocultar Detalles" : "Ver Detalles"}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-4 space-y-4">
                      <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-md space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm mb-2">
                          <Info className="h-4 w-4 text-primary" />
                          Información Adicional
                        </h4>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="h-3.5 w-3.5" />
                            <span>Categoría:</span>
                          </div>
                          <span className="font-medium">{bundle.categoryId}</span>
                        </div>

                        {bundle.currencyType === "BS" && bundle.conversionRate && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Coins className="h-3.5 w-3.5" />
                              <span>Tasa de cambio:</span>
                            </div>
                            <span className="font-medium">{Number(bundle.conversionRate).toFixed(2)} Bs/USD</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Percent className="h-3.5 w-3.5" />
                            <span>Ganancia (%):</span>
                          </div>
                          <span
                            className={cn(
                              "font-medium",
                              bundle.profitPercentage < 0 ? "text-destructive" : "text-green-600 dark:text-green-500",
                            )}
                          >
                            {bundle.profitPercentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Layers className="h-4 w-4 text-primary" />
                          Artículos incluidos
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {bundle.items.map((item) => (
                            <div
                              key={item.itemId}
                              className="bg-card dark:bg-card/80 border border-border/60 dark:border-border/30 rounded-md p-3 shadow-sm"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{item.item.name}</p>
                                  <p className="text-xs text-muted-foreground">SKU: {item.item.sku}</p>
                                </div>
                                <Badge variant="outline" className="ml-2 bg-primary/5 dark:bg-primary/10">
                                  {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>Costo:</span>
                                <span className="font-medium">
                                  {formatCurrency(Number(item.costPrice || item.item.costPrice || 0) * item.quantity)}
                                </span>
                                <ArrowRight className="h-3 w-3 mx-1" />
                                <span>Precio base:</span>
                                <span className="font-medium">
                                  {formatCurrency(Number(item.item.basePrice) * item.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Diálogo de clonación */}
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              Clonar Paquete
            </DialogTitle>
            <DialogDescription>
              Estás clonando el paquete: <span className="font-medium">{bundleToClone?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label htmlFor="new-name" className="text-sm font-medium">
                Nombre del nuevo paquete
              </label>
              <Input
                id="new-name"
                placeholder="Ingresa el nuevo nombre"
                value={newBundleName}
                onChange={(e) => setNewBundleName(e.target.value)}
                className={cloneError ? "border-destructive" : ""}
              />
              {cloneError && <p className="text-sm text-destructive">{cloneError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)} disabled={isCloning}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloneBundle}
              disabled={isCloning || !newBundleName}
              className="gap-2"
            >
              {isCloning ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Clonando...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Clonar Paquete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Paquete
            </DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el paquete <span className="font-medium">{bundleToDeleteName}</span>. Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Se requiere autorización</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Ingresa el código de autorización para confirmar la eliminación.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="auth-code" className="text-sm font-medium">
                Código de autorización
              </label>
              <Input
                id="auth-code"
                type="password"
                placeholder="Ingresa el código"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className={deleteError ? "border-destructive" : ""}
              />
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBundle}
              disabled={isDeleting || !authCode}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Eliminar Paquete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Building(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}