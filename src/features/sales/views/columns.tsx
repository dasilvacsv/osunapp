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
  ShoppingBag,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  BookOpen,
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
import { PaymentPlanDialog } from "@/features/sales/payment-plan-dialog"
import { Switch } from "@/components/ui/switch"

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
      return (
        <Link
          href={`/sales/${id}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
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
              <p><strong>Nombre:</strong> {beneficiario.firstName || '-'}</p>
              <p><strong>Apellido:</strong> {beneficiario.lastName || '-'}</p>
              <p><strong>Escuela:</strong> {beneficiario.school || '-'}</p>
              <p><strong>Nivel:</strong> {beneficiario.level || '-'}</p>
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

      return (
        <div className="flex items-center gap-1.5">
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

      const amount = row.getValue("totalAmount")
      return <div className="text-right font-medium text-sm">{formatCurrency(amount)}</div>
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
        APPROVED: "Aprobado",
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
    accessorKey: "isPaid",
    header: () => (
      <div className="flex items-center gap-1">
        <CreditCard className="h-3.5 w-3.5" />
        <span className="text-xs">Pago</span>
      </div>
    ),
    cell: ({ row }) => {
      const isPaid = row.getValue("isPaid") as boolean

      return (
        <Badge
          variant={isPaid ? "success" : "outline"}
          className={cn(
            "text-xs py-0 h-5",
            isPaid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "",
          )}
        >
          {isPaid ? "Pagado" : "Pendiente"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentMethod",
    header: () => <span className="text-xs">Método</span>,
    cell: ({ row }) => {
      if (!row.original?.paymentMethod) {
        return <div className="text-muted-foreground text-xs">-</div>
      }

      const method = row.original.paymentMethod
      const labels = {
        CASH: "Efectivo",
        CARD: "Tarjeta",
        TRANSFER: "Transf.",
        CREDIT: "Crédito",
        DEBIT: "Débito",
      }
      const icons = {
        CASH: "💵",
        CARD: "💳",
        TRANSFER: "🏦",
        CREDIT: "📈",
        DEBIT: "📉",
      }

      return (
        <Badge variant="outline" className="capitalize text-xs py-0 h-5 flex items-center gap-1">
          <span>{icons[method as keyof typeof icons] || "💸"}</span>
          {labels[method as keyof typeof labels] || method.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "allowPreSale",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-xs">
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>Pre-Venta</span>
      </div>
    ),
    cell: ({ row }) => {
      const allowPreSale = row.original?.allowPreSale || false
      const [isEnabled, setIsEnabled] = useState(allowPreSale)

      const handleToggle = async (checked: boolean) => {
        setIsEnabled(checked)
        try {
          if (row.original?.id) {
            await updateItemPreSaleFlag(row.original.id, checked)
          }
        } catch (error) {
          console.error("Error updating pre-sale flag:", error)
          setIsEnabled(!checked)
        }
      }

      return (
        <div className="flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                    className={cn("data-[state=checked]:bg-red-500", isEnabled && "ring-1 ring-red-300")}
                  />
                  {isEnabled && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0 h-5">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pre-venta
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>{isEnabled ? "Permitir venta sin stock disponible" : "Requiere stock disponible para vender"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      const [isDialogOpen, setIsDialogOpen] = useState(false)

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
                    console.log("View payments for sale", sale.id)
                  }}
                  className="cursor-pointer text-xs"
                >
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Ver pagos
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

