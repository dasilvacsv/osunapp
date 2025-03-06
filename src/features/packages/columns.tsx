"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Package2, ChevronDown, ChevronRight, Users, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

export type PackageRow = {
  id: string
  name: string
  type: string
  basePrice: number
  totalSales: number
  totalRevenue: string
  beneficiaries: Array<{
    id: string
    firstName: string
    lastName: string
    school: string
    level: string
    section: string
  }>
  status: string
  lastSaleDate?: string
}

// Componente para mostrar los beneficiarios de forma colapsable
const BeneficiariesCollapsible = ({
  beneficiaries,
  packageId,
}: {
  beneficiaries: PackageRow["beneficiaries"]
  packageId: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!beneficiaries || beneficiaries.length === 0) {
    return (
      <Badge variant="outline" className="bg-gray-100">
        Sin beneficiarios
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 p-1 h-auto text-xs"
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Users className="w-3 h-3 mr-1" />
        {beneficiaries.length} Beneficiario{beneficiaries.length !== 1 ? "s" : ""}
      </Button>

      {isOpen && (
        <div className="pl-4 border-l-2 border-gray-200 space-y-2 animate-in fade-in-50 slide-in-from-top-5 duration-300">
          {beneficiaries.slice(0, 3).map((beneficiary) => (
            <Link
              key={beneficiary.id}
              href={`/packages/beneficiaries/${beneficiary.id}`}
              className="block text-xs hover:underline text-muted-foreground hover:text-foreground transition-colors"
            >
              {beneficiary.firstName} {beneficiary.lastName} - {beneficiary.school}
            </Link>
          ))}

          {beneficiaries.length > 3 && (
            <Link href={`/packages/${packageId}`} className="block text-xs font-medium text-primary hover:underline">
              Ver {beneficiaries.length - 3} más...
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export const columns: ColumnDef<PackageRow>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return (
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <Package2 className="w-4 h-4 text-primary" />
          </div>
          <Link href={`/packages/${row.original.id}`} className="font-medium hover:underline text-foreground">
            {row.getValue("name")}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      const typeLabels: Record<string, string> = {
        SCHOOL_PACKAGE: "Escolar",
        ORGANIZATION_PACKAGE: "Organizacional",
        REGULAR: "Regular",
      }

      const type = row.getValue("type") as string

      return (
        <Badge variant="outline" className="capitalize">
          {typeLabels[type] || type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "basePrice",
    header: "Precio Base",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return (
        <div className="font-medium text-foreground flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          {formatCurrency(row.getValue("basePrice"))}
        </div>
      )
    },
  },
  {
    accessorKey: "totalSales",
    header: "Ventas",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return (
        <div className="flex items-center gap-1">
          <ShoppingCart className="w-3 h-3 text-muted-foreground" />
          <span>{row.getValue("totalSales")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Ingresos",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return (
        <div className="font-medium text-green-600 dark:text-green-400">
          {formatCurrency(row.getValue("totalRevenue"))}
        </div>
      )
    },
  },
  {
    accessorKey: "beneficiaries",
    header: "Beneficiarios",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return <BeneficiariesCollapsible beneficiaries={row.original.beneficiaries} packageId={row.original.id} />
    },
  },
  {
    accessorKey: "lastSaleDate",
    header: "Última Venta",
    cell: ({ row }) => {
      if (!row.original || !row.original.lastSaleDate) {
        return <div className="text-muted-foreground text-xs">Sin ventas</div>
      }

      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {new Date(row.original.lastSaleDate).toLocaleDateString()}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      const status = row.getValue("status") as string
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        ACTIVE: "default",
        INACTIVE: "secondary",
      }

      const labels: Record<string, string> = {
        ACTIVE: "Activo",
        INACTIVE: "Inactivo",
      }

      return (
        <Badge variant={variants[status] || "outline"} className="capitalize">
          {labels[status] || status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      if (!row.original) {
        return <div className="text-muted-foreground">No disponible</div>
      }

      return (
        <div className="flex items-center gap-2">
          <Link href={`/packages/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )
    },
  },
]

