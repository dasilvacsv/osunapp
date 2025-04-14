"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import {
  FileText,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Package2,
  CreditCard,
  MoreHorizontal,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  FileCheck,
  FilePenLine,
  Loader2,
  Gift,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { updateSaleVendidoStatus, updateSaleDraftStatus, updateSaleDonation } from "@/features/sales/actions"

import { deletePurchase } from "./actions"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { PaymentPlanDialog } from "./plan/payment-plan-dialog"

export type Sale = {
  id: string
  client: {
    name: string
    id: string
  }
  organization?: {
    id: string
    name: string
  }
  beneficiario?: {
    id: string
    name: string
    grade?: string
    section?: string
    firstName?: string
    lastName?: string
    school?: string
    level?: string
  }
  bundle?: {
    id: string
    name: string
  }
  bundleName?: string
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  totalAmount: number
  paymentMethod: string
  purchaseDate: Date
  transactionReference?: string
  saleType: "DIRECT" | "PRESALE"
  isPaid: boolean
  isDraft?: boolean
  isDonation?: boolean
  vendido?: boolean
  currencyType?: string
  conversionRate?: number
  paymentPlan?: {
    id: string
    installmentCount: number
    installmentFrequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  }
  allowPreSale?: boolean
}

const StatusIcon = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Clock,
  APPROVED: CheckCircle2,
  PENDING: Clock,
  CANCELLED: XCircle,
} as const

const StatusColors = {
  COMPLETED: "text-green-500 dark:text-green-400",
  IN_PROGRESS: "text-blue-500 dark:text-blue-400",
  APPROVED: "text-blue-500 dark:text-blue-400",
  PENDING: "text-yellow-500 dark:text-yellow-400",
  CANCELLED: "text-red-500 dark:text-red-400",
} as const

function DonationApprovalActions({ sale }: { sale: Sale }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const isAdmin = useMemo(() => session?.user?.role === "ADMIN", [session])

  if (!isAdmin || !sale.isDonation || !sale.isDraft) {
    return null
  }

  const handleApprove = async () => {
    try {
      setIsProcessing(true)
      const result = await updateSaleDraftStatus(sale.id, false)

      if (result.success) {
        toast({
          title: "Donación aprobada",
          description: "La donación ha sido aprobada exitosamente",
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })

        window.dispatchEvent(
          new CustomEvent("sales-updated", {
            detail: { id: sale.id, action: "approve-donation" },
          })
        )
      } else {
        throw new Error(result.error || "Error al aprobar la donación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al aprobar la donación",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsProcessing(true)
      const result = await updateSaleDonation(sale.id, false)

      if (result.success) {
        toast({
          title: "Donación rechazada",
          description: "La donación ha sido rechazada",
          className: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
        })

        window.dispatchEvent(
          new CustomEvent("sales-updated", {
            detail: { id: sale.id, action: "reject-donation" },
          })
        )
      } else {
        throw new Error(result.error || "Error al rechazar la donación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al rechazar la donación",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleApprove}
        disabled={isProcessing}
        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/40"
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        )}
        Aprobar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isProcessing}
        className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/40"
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <XCircle className="h-3.5 w-3.5 mr-1" />
        )}
        Rechazar
      </Button>
    </div>
  )
}

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => {
      const sale = row.original
      if (!sale) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      return (
        <Link
          href={`/sales/${sale.id}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          {sale.isDraft ? (
            <FilePenLine className="h-4 w-4 transition-transform group-hover:scale-110 text-amber-500" />
          ) : (
            <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          <span className="font-mono">#{sale.id.slice(0, 8).toUpperCase()}</span>
          {sale.isDonation && <Gift className="h-4 w-4 text-purple-500" />}
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </Link>
      )
    },
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
    cell: ({ row }) => {
      const sale = row.original
      if (!sale?.client) {
        return (
          <div className="text-muted-foreground text-xs flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sin datos
          </div>
        )
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="font-medium text-sm hover:text-primary transition-colors cursor-help">
                {sale.client.name}
                {sale.organization && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {sale.organization.name}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p>ID: {sale.client.id || "No disponible"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "beneficiario.name",
    header: () => (
      <div className="flex items-center gap-1">
        <User className="h-3.5 w-3.5" />
        <span className="text-xs">Beneficiario</span>
      </div>
    ),
    cell: ({ row }) => {
      const beneficiario = row.original?.beneficiario
      if (!beneficiario) {
        return <span className="text-muted-foreground text-xs">-</span>
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{beneficiario.name}</span>
                {beneficiario.grade && beneficiario.section && (
                  <span className="text-xs text-muted-foreground">
                    {beneficiario.grade} - {beneficiario.section}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs space-y-1">
              <p>
                <strong>Nombre:</strong> {beneficiario.firstName || "-"}
              </p>
              <p>
                <strong>Apellido:</strong> {beneficiario.lastName || "-"}
              </p>
              <p>
                <strong>Escuela:</strong> {beneficiario.school || "-"}
              </p>
              <p>
                <strong>Nivel:</strong> {beneficiario.level || "-"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "bundleName",
    header: () => (
      <div className="flex items-center gap-1">
        <BookOpen className="h-3.5 w-3.5" />
        <span className="text-xs">Paquete</span>
      </div>
    ),
    cell: ({ row }) => {
      const bundleName = row.original?.bundle?.name || row.original?.bundleName
      if (!bundleName) {
        return <span className="text-muted-foreground text-xs">-</span>
      }

      return (
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium truncate max-w-[120px]">{bundleName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "organization",
    header: () => (
      <div className="flex items-center gap-1">
        <Building2 className="h-3.5 w-3.5" />
        <span className="text-xs">Organización</span>
      </div>
    ),
    cell: ({ row }) => {
      const organization = row.original?.organization
      if (!organization) {
        return <span className="text-muted-foreground text-xs">-</span>
      }

      return (
        <div className="flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium truncate max-w-[120px]">{organization.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "saleType",
    header: () => <span className="text-xs">Tipo</span>,
    cell: ({ row }) => {
      const sale = row.original
      const saleType = sale.saleType
      const allowPreSale = sale.allowPreSale

      return (
        <div className="flex items-center gap-1.5">
          {sale.isDraft && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 flex items-center gap-1 py-0.5 h-5 text-xs"
            >
              <FilePenLine className="h-3 w-3" />
              <span>Borrador</span>
            </Badge>
          )}

          {sale.isDonation && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 flex items-center gap-1 py-0.5 h-5 text-xs"
            >
              <Gift className="h-3 w-3" />
              <span>Donación</span>
            </Badge>
          )}

          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 py-0.5 h-5 text-xs",
              saleType === "PRESALE" || allowPreSale
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
                : "",
            )}
          >
            {saleType === "DIRECT" ? (
              <>
                <Package2 className="h-3 w-3" />
                <span>Directa</span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>Preventa</span>
              </>
            )}
          </Badge>

          {(saleType === "PRESALE" || allowPreSale) && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0 h-5">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pre-venta
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "currencyType",
    header: () => <span className="text-xs">Moneda</span>,
    cell: ({ row }) => {
      const sale = row.original
      const currencyType = sale.currencyType || "USD"
      const conversionRate = sale.conversionRate || 1

      return (
        <Badge
          variant="outline"
          className={cn(
            "py-0.5 h-5 text-xs",
            currencyType === "USD"
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
          )}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          {currencyType}
          <span className="ml-1 text-xs opacity-70">
            {currencyType === "USD" ? `(Tasa: ${conversionRate})` : `(Tasa: 1/${conversionRate})`}
          </span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "vendido",
    header: () => <span className="text-xs">Vendido</span>,
    cell: ({ row }) => {
      const [vendido, setVendido] = useState(row.original.vendido || false)
      const [isUpdating, setIsUpdating] = useState(false)

      const handleVendidoChange = async (checked: boolean) => {
        try {
          setIsUpdating(true)
          const result = await updateSaleVendidoStatus(row.original.id, checked)

          if (result.success) {
            setVendido(checked)
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.error("Error updating vendido status:", error)
          setVendido(!checked)
        } finally {
          setIsUpdating(false)
        }
      }

      return (
        <div className="flex items-center">
          <Switch
            checked={vendido}
            onCheckedChange={handleVendidoChange}
            disabled={isUpdating}
            className={cn(vendido ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700")}
          />
          {isUpdating && <Clock className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      )
    },
  },
  {
    accessorKey: "purchaseDate",
    header: () => (
      <div className="flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs">Fecha</span>
      </div>
    ),
    cell: ({ row }) => {
      const purchaseDate = row.original?.purchaseDate
      if (!purchaseDate) {
        return <div className="text-muted-foreground text-xs">-</div>
      }

      const date = new Date(purchaseDate)
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-help flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(date)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {date.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => (
      <div className="flex items-center gap-1 justify-end">
        <DollarSign className="h-3.5 w-3.5" />
        <span className="text-xs">Total</span>
      </div>
    ),
    cell: ({ row }) => {
      const sale = row.original
      const amount = Number(sale.totalAmount)
      const currencyType = sale.currencyType || "USD"
      const conversionRate = sale.conversionRate || 1
      const convertedAmount = currencyType === "USD" ? amount * conversionRate : amount / conversionRate

      return (
        <div className="text-right">
          <div className="font-medium text-sm">
            {formatCurrency(amount)} {currencyType}
          </div>
          <div className="text-xs text-muted-foreground">
            ≈ {formatCurrency(convertedAmount)} {currencyType === "USD" ? "BS" : "USD"}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <span className="text-xs">Estado</span>,
    cell: ({ row }) => {
      const status = row.original?.status
      if (!status) {
        return <div className="text-muted-foreground text-xs">-</div>
      }

      const StatusIconComponent = StatusIcon[status] || AlertCircle
      const statusColor = StatusColors[status] || "text-muted-foreground"
      const variants = {
        COMPLETED: "success",
        IN_PROGRESS: "default",
        APPROVED: "default",
        PENDING: "warning",
        CANCELLED: "destructive",
      } as const
      const labels = {
        COMPLETED: "Completado",
        IN_PROGRESS: "En Proceso",
        APPROVED: "Entregado",
        PENDING: "Pendiente",
        CANCELLED: "Cancelado",
      }

      return (
        <div className="flex items-center gap-1">
          <StatusIconComponent className={`w-3.5 h-3.5 ${statusColor}`} />
          <Badge variant={variants[status]} className="capitalize text-xs py-0 h-5">
            {labels[status as keyof typeof labels] || status.toLowerCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "donationApproval",
    header: () => <span className="text-xs">Aprobación</span>,
    cell: ({ row }) => {
      const sale = row.original
      if (!sale.isDonation || !sale.isDraft) {
        return null
      }
      return <DonationApprovalActions sale={sale} />
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
      const [isUpdating, setIsUpdating] = useState(false)
      const { toast } = useToast()

      const handleDraftStatusChange = async (isDraft: boolean) => {
        try {
          setIsUpdating(true)
          const result = await updateSaleDraftStatus(sale.id, isDraft)

          if (result.success) {
            window.dispatchEvent(
              new CustomEvent("sales-updated", {
                detail: { id: sale.id, isDraft },
              })
            )
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.error("Error updating draft status:", error)
        } finally {
          setIsUpdating(false)
        }
      }

      const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar esta venta y todos sus registros relacionados?")) {
          return
        }

        try {
          const result = await deletePurchase(sale.id)
          
          if (result.success) {
            toast({
              title: "Venta eliminada",
              description: "La venta y sus registros relacionados han sido eliminados exitosamente.",
              className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
            })
            window.dispatchEvent(new CustomEvent("sales-updated"))
          } else {
            throw new Error(result.error || "Error al eliminar la venta")
          }
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al eliminar la venta",
            variant: "destructive",
          })
        }
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => (window.location.href = `/sales/${sale.id}`)}
                className="cursor-pointer text-xs"
              >
                <FileText className="mr-2 h-3.5 w-3.5" />
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {!sale.isPaid && !sale.paymentPlan && (
                <DropdownMenuItem onClick={() => setShowPaymentPlanDialog(true)} className="cursor-pointer text-xs">
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Crear plan de pago
                </DropdownMenuItem>
              )}

              {sale.paymentPlan && (
                <DropdownMenuItem
                  onClick={() => {
                    console.log("Ver pagos para venta", sale.id)
                  }}
                  className="cursor-pointer text-xs"
                >
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Ver pagos
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {sale.isDraft ? (
                <DropdownMenuItem
                  onClick={() => handleDraftStatusChange(false)}
                  className="cursor-pointer text-xs"
                  disabled={isUpdating}
                >
                  <FileCheck className="mr-2 h-3.5 w-3.5" />
                  Aprobar borrador
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleDraftStatusChange(true)}
                  className="cursor-pointer text-xs"
                  disabled={isUpdating}
                >
                  <FilePenLine className="mr-2 h-3.5 w-3.5" />
                  Marcar como borrador
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-xs text-red-600 focus:bg-red-50 dark:text-red-400"
              >
                <XCircle className="mr-2 h-3.5 w-3.5" />
                Eliminar con cascade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {showPaymentPlanDialog && (
            <PaymentPlanDialog
              open={showPaymentPlanDialog}
              onOpenChange={setShowPaymentPlanDialog}
              purchaseId={sale.id}
              totalAmount={sale.totalAmount}
              onSuccess={() => {
                setShowPaymentPlanDialog(false)
                window.dispatchEvent(new CustomEvent("sales-updated"))
              }}
            />
          )}
        </>
      )
    },
  },
]