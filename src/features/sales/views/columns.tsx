"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  FileText,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CalendarRange,
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { PaymentPlanDialog } from "@/features/sales/views/plan/payment-plan-dialog"
import { Switch } from "@/components/ui/switch"
import { updateSaleVendidoStatus, updateSaleDraftStatus } from "@/features/sales/actions"

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
}

const StatusColors = {
  COMPLETED: "text-green-500 dark:text-green-400",
  IN_PROGRESS: "text-blue-500 dark:text-blue-400",
  APPROVED: "text-blue-500 dark:text-blue-400",
  PENDING: "text-yellow-500 dark:text-yellow-400",
  CANCELLED: "text-red-500 dark:text-red-400",
}

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => {
      if (!row.original) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Datos no disponibles</span>
          </div>
        )
      }

      const id = row.original.id
      if (!id) {
        return (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>ID no disponible</span>
          </div>
        )
      }

      // Add draft badge if it's a draft
      const isDraft = row.original.isDraft

      return (
        <Link
          href={`/sales/${id}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          {isDraft ? (
            <FilePenLine className="h-4 w-4 transition-transform group-hover:scale-110 text-amber-500" />
          ) : (
            <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          <span className="font-mono">#{id.slice(0, 8).toUpperCase()}</span>
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </Link>
      )
    },
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
    cell: ({ row }) => {
      if (!row.original?.client) {
        return (
          <div className="text-muted-foreground text-xs flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sin datos
          </div>
        )
      }

      const clientName = row.original.client?.name
      const clientId = row.original.client?.id

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="font-medium text-sm hover:text-primary transition-colors cursor-help">
                {clientName}
                {row.original.organization && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {row.original.organization.name}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p>ID: {clientId || "No disponible"}</p>
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
      const saleType = row.getValue("saleType") as string
      const allowPreSale = row.original?.allowPreSale || false
      const isDraft = row.original?.isDraft || false

      return (
        <div className="flex items-center gap-1.5">
          {isDraft && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 flex items-center gap-1 py-0.5 h-5 text-xs"
            >
              <FilePenLine className="h-3 w-3" />
              <span>Borrador</span>
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
                <CalendarRange className="h-3 w-3" />
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
      const currencyType = row.original?.currencyType || "USD"
      const conversionRate = row.original?.conversionRate || 1
  
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
      const [vendido, setVendido] = useState(row.original?.vendido || false)
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
          // Revert the switch if there was an error
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
      if (!row.original?.purchaseDate) {
        return <div className="text-muted-foreground text-xs">-</div>
      }

      const date = new Date(row.original.purchaseDate)
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
      if (!row || typeof row.getValue !== "function") {
        return <div className="text-muted-foreground text-xs">-</div>
      }
  
      const amount = Number(row.getValue("totalAmount"))
      const currencyType = row.original?.currencyType || "USD"
      const conversionRate = row.original?.conversionRate || 1
  
      // Calcular conversión
      const convertedAmount = currencyType === "USD" 
        ? amount * conversionRate
        : amount / conversionRate
  
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
      if (!row.original?.status) {
        return <div className="text-muted-foreground text-xs">-</div>
      }

      const status = row.original.status
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="flex items-center gap-1"
        >
          <StatusIconComponent className={`w-3.5 h-3.5 ${statusColor}`} />
          <Badge variant={variants[status] || "outline"} className="capitalize text-xs py-0 h-5">
            {labels[status as keyof typeof labels] || status.toLowerCase()}
          </Badge>
        </motion.div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      const [isDialogOpen, setIsDialogOpen] = useState(false)
      const [isUpdating, setIsUpdating] = useState(false)

      const handleDraftStatusChange = async (isDraft: boolean) => {
        try {
          setIsUpdating(true)
          const result = await updateSaleDraftStatus(sale.id, isDraft)

          if (result.success) {
            // Dispatch a custom event to refresh the table
            const event = new CustomEvent("sales-updated", {
              detail: { id: sale.id, isDraft },
            })
            window.dispatchEvent(event)
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.error("Error updating draft status:", error)
        } finally {
          setIsUpdating(false)
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
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="cursor-pointer text-xs">
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
            </DropdownMenuContent>
          </DropdownMenu>

          <PaymentPlanDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            purchaseId={sale.id}
            totalAmount={sale.totalAmount}
            onSuccess={() => {
              setIsDialogOpen(false)
            }}
          />
        </>
      )
    },
  },
]

