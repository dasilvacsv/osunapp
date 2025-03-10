"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Eye,
  Package2,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  School,
  GraduationCap,
  User,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
    status: "ACTIVE" | "INACTIVE"
    organizationId?: string
    isComplete?: boolean
  }>
  status: string
  lastSaleDate?: string
}

const BeneficiariesCollapsible = ({
  beneficiaries,
  packageId,
}: {
  beneficiaries: PackageRow["beneficiaries"]
  packageId: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  // Make sure beneficiaries is always an array
  const beneficiaryArray = Array.isArray(beneficiaries) ? beneficiaries : []

  if (!beneficiaryArray || beneficiaryArray.length === 0) {
    return (
      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        Sin beneficiarios
      </Badge>
    )
  }

  const activeBeneficiaries = beneficiaryArray.filter((b) => b.status === "ACTIVE")
  const incompleteBeneficiaries = beneficiaryArray.filter((b) => b.isComplete === false)

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 h-8 px-3
          transition-colors duration-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${isOpen ? "bg-gray-100 dark:bg-gray-800" : ""}
        `}
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Users className="w-4 h-4" />
        <span className="font-medium">
          {activeBeneficiaries.length} Activo{activeBeneficiaries.length !== 1 ? "s" : ""}
        </span>
        {beneficiaryArray.length > activeBeneficiaries.length && (
          <Badge variant="secondary" className="ml-2 text-xs">
            +{beneficiaryArray.length - activeBeneficiaries.length} inactivo
            {beneficiaryArray.length - activeBeneficiaries.length !== 1 ? "s" : ""}
          </Badge>
        )}
        {incompleteBeneficiaries.length > 0 && (
          <Badge
            variant="outline"
            className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          >
            {incompleteBeneficiaries.length} incompleto{incompleteBeneficiaries.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3 pt-2">
              {beneficiaryArray.map((beneficiary, index) => (
                <motion.div
                  key={beneficiary.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative group rounded-lg p-3
                    ${
                      beneficiary.isComplete === false
                        ? "bg-red-50 dark:bg-red-900/10"
                        : beneficiary.status === "ACTIVE"
                          ? "bg-gray-50 dark:bg-gray-800/50"
                          : "bg-gray-100/50 dark:bg-gray-800/20"
                    }
                  `}
                >
                  <Link
                    href={`/packages/beneficiaries/${beneficiary.id}`}
                    className="block space-y-1 hover:no-underline"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {beneficiary.firstName} {beneficiary.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {beneficiary.isComplete === false && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Incompleto
                          </Badge>
                        )}
                        {beneficiary.status === "INACTIVE" && (
                          <Badge variant="secondary" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5" />
                        {beneficiary.school}
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {beneficiary.level} - {beneficiary.section}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const columns: ColumnDef<PackageRow>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const typeIcons = {
        SCHOOL_PACKAGE: School,
        ORGANIZATION_PACKAGE: Users,
        REGULAR: Package2,
      }
      const type = row.getValue("type") as keyof typeof typeIcons
      const Icon = typeIcons[type] || Package2

      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Link
              href={`/packages/${row.original.id}`}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors"
            >
              {row.getValue("name")}
            </Link>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {row.original.id.slice(0, 8)}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const typeLabels: Record<string, string> = {
        SCHOOL_PACKAGE: "Escolar",
        ORGANIZATION_PACKAGE: "Organizacional",
        REGULAR: "Regular",
      }

      const typeColors: Record<string, string> = {
        SCHOOL_PACKAGE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        ORGANIZATION_PACKAGE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        REGULAR: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      }

      const type = row.getValue("type") as string

      return (
        <Badge variant="outline" className={`${typeColors[type]} border-transparent font-medium`}>
          {typeLabels[type] || type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "basePrice",
    header: "Precio Base",
    cell: ({ row }) => {
      return (
        <div className="font-medium tabular-nums">
          <div className="flex items-center gap-1 text-gray-900 dark:text-gray-100">
            <DollarSign className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            {formatCurrency(row.getValue("basePrice"))}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "totalSales",
    header: "Ventas",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded">
            <ShoppingCart className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
          </div>
          <span className="tabular-nums font-medium text-gray-900 dark:text-gray-100">
            {row.getValue("totalSales")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Ingresos",
    cell: ({ row }) => {
      return (
        <div className="font-medium text-green-600 dark:text-green-400 tabular-nums">
          {formatCurrency(row.getValue("totalRevenue"))}
        </div>
      )
    },
  },
  {
    accessorKey: "beneficiaries",
    header: "Beneficiarios",
    cell: ({ row }) => {
      return <BeneficiariesCollapsible beneficiaries={row.original.beneficiaries} packageId={row.original.id} />
    },
  },
  {
    accessorKey: "lastSaleDate",
    header: "Última Venta",
    cell: ({ row }) => {
      if (!row.original.lastSaleDate) {
        return <div className="text-sm text-gray-500 dark:text-gray-400">Sin ventas</div>
      }

      const date = new Date(row.original.lastSaleDate)
      const formattedDate = new Intl.DateTimeFormat("es", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)

      return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusConfig: Record<string, { label: string; className: string }> = {
        ACTIVE: {
          label: "Activo",
          className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        },
        INACTIVE: {
          label: "Inactivo",
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
        },
      }

      const config = statusConfig[status] || {
        label: status,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      }

      return (
        <Badge variant="outline" className={`${config.className} border-transparent font-medium`}>
          {config.label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/packages/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )
    },
  },
]

