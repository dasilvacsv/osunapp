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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define the motion div component with proper types
const MotionDiv = motion.div

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
          <Package className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> Nombre{" "}
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
                  <span>Precio Base: {formatCurrency(Number(item.basePrice))}</span>
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
    header: "Tipo",
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
          <DollarSign className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> Precio
          Base <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
    header: "Stock Actual",
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
    header: "Reservado",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-muted-foreground">{row.getValue("reservedStock")}</span>
    ),
  },
  {
    accessorKey: "minimumStock",
    header: "Stock Mín",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums text-muted-foreground">{row.getValue("minimumStock")}</span>
    ),
  },
  // Reemplazar la celda de allowPresale en las columnas
  {
    accessorKey: "allowPresale",
    header: () => (
      <div className="flex items-center gap-1 justify-center">
        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
        <span>Pre-Venta</span>
      </div>
    ),
    cell: ({ row }) => {
      const isAllowPresale = row.original.allowPresale

      return isAllowPresale ? (
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0 h-5">
            <Flag className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        </div>
      ) : null
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
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
            {status === "ACTIVE" ? "Activo" : "Inactivo"}
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

