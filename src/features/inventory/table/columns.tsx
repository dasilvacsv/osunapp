"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { InventoryItem } from "../types"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Package,
  DollarSign,
  Archive,
  Flag,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { updatePreSaleFlag } from "../actions"
import { useToast } from "@/hooks/use-toast"

// Define the motion div component with proper types
const MotionDiv = motion.div

// Componente independiente para el toggle de pre-venta
function PreSaleToggle({
  itemId,
  initialValue,
  onToggleSuccess,
}: {
  itemId: string
  initialValue: boolean
  onToggleSuccess: () => void
}) {
  const { toast } = useToast()
  const [isEnabled, setIsEnabled] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  // Actualizar el estado local cuando cambia el valor inicial
  useEffect(() => {
    setIsEnabled(initialValue)
  }, [initialValue])

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const result = await updatePreSaleFlag(itemId, checked)
      if (result.success) {
        setIsEnabled(checked)
        toast({
          title: checked ? "Pre-venta habilitada" : "Pre-venta deshabilitada",
          description: checked
            ? "Ahora se puede vender este producto sin stock disponible"
            : "Este producto ahora requiere stock disponible para venderse",
          variant: checked ? "default" : "secondary",
        })

        // Notificar éxito para actualizar la tabla
        onToggleSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el estado de pre-venta",
          variant: "destructive",
        })
        // Revertir el estado visual si hay error
        setIsEnabled(!checked)
      }
    } catch (error) {
      console.error("Error updating pre-sale flag:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado de pre-venta",
        variant: "destructive",
      })
      // Revertir el estado visual si hay error
      setIsEnabled(!checked)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Switch
                id={`presale-switch-${itemId}`}
                name={`presale-switch-${itemId}`}
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isUpdating}
                className={cn("data-[state=checked]:bg-red-500", isEnabled && "ring-1 ring-red-300")}
              />
              {isEnabled && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0 h-5">
                  <Flag className="h-3 w-3 mr-1" />
                  Activo
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
}

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group flex items-center gap-1 hover:bg-muted/50 transition-colors"
        >
          <Package className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> Name{" "}
          <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const item = row.original
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <MotionDiv
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {name}
            </MotionDiv>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-semibold">{name}</h4>
                {item.allowPresale && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                    <Flag className="h-3 w-3 mr-1 text-red-500" />
                    Pre-venta
                  </Badge>
                )}
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <span>SKU: {item.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>Base Price: {formatCurrency(Number(item.basePrice))}</span>
                </div>
                <Badge variant="outline" className="w-fit">
                  {item.type}
                </Badge>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <Archive className="w-4 h-4 text-muted-foreground" /> <span>SKU</span>
      </div>
    ),
    cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue("sku")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant="outline">{type === "PHYSICAL" ? "Físico" : type === "DIGITAL" ? "Digital" : "Servicio"}</Badge>
      )
    },
  },
  {
    accessorKey: "basePrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group flex items-center gap-1 hover:bg-muted/50 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> Base Price{" "}
          <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("basePrice"))
      const formatted = formatCurrency(amount)
      return (
        <MotionDiv
          className="font-medium tabular-nums text-foreground"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatted}
        </MotionDiv>
      )
    },
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
    cell: ({ row }) => {
      const stock = row.getValue("currentStock") as number
      const minStock = row.getValue("minimumStock") as number
      const isLowStock = stock <= minStock
      const allowPresale = row.original.allowPresale

      return (
        <MotionDiv
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span
            className={cn(
              "font-medium tabular-nums",
              isLowStock ? "text-red-500 dark:text-red-400" : "text-foreground",
              "transition-colors duration-200",
            )}
          >
            {stock}
          </span>
          <AnimatePresence>
            {isLowStock && (
              <MotionDiv
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </TooltipTrigger>
                    <TooltipContent className="p-2">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        ¡Stock por debajo del nivel mínimo!
                        {allowPresale && " (Pre-venta habilitada)"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      )
    },
  },
  {
    accessorKey: "reservedStock",
    header: "Reserved",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-muted-foreground">{row.getValue("reservedStock")}</span>
    ),
  },
  {
    accessorKey: "preSaleCount",
    header: () => (
      <div className="flex items-center gap-1">
        <Flag className="w-4 h-4 text-red-500" />
        <span>Pre-Venta</span>
      </div>
    ),
    cell: ({ row }) => {
      const count = row.getValue("preSaleCount") as number

      return (
        <div className="flex items-center gap-2">
          {count > 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <Flag className="h-3 w-3 mr-1 text-red-500" />
                    {count}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{count} unidades en pre-venta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-xs text-muted-foreground">0</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "minimumStock",
    header: "Min Stock",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-muted-foreground">{row.getValue("minimumStock")}</span>
    ),
  },
  {
    accessorKey: "allowPresale",
    header: () => (
      <div className="flex items-center gap-1 justify-center">
        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
        <span>Pre-Venta</span>
      </div>
    ),
    cell: ({ row, table }) => {
      // Extraer el ID único de la fila para evitar problemas de estado compartido
      const itemId = row.original.id
      const isAllowPresale = row.original.allowPresale

      // Usar una función de componente independiente para cada celda
      return (
        <PreSaleToggle
          itemId={itemId}
          initialValue={isAllowPresale}
          onToggleSuccess={() => {
            // Disparar evento para actualizar la tabla
            window.dispatchEvent(new CustomEvent("inventory-updated", { detail: { itemId } }))
          }}
        />
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const isActive = status === "ACTIVE"

      return (
        <MotionDiv
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "capitalize transition-all duration-200",
              isActive
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                : "hover:bg-muted/70",
            )}
          >
            {status.toLowerCase()}
          </Badge>
          <AnimatePresence>
            {isActive && (
              <MotionDiv
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      )
    },
  },
]

