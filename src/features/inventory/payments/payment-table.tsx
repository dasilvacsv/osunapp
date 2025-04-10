"use client"

import { useState, useEffect } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaginationComponent } from "@/components/pagination"

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const variants = {
    PAID: { variant: "success", label: "Pagado" },
    PENDING: { variant: "warning", label: "Pendiente" },
    OVERDUE: { variant: "destructive", label: "Vencido" },
    CANCELLED: { variant: "secondary", label: "Cancelado" },
  }

  const { variant, label } = variants[status] || { variant: "default", label: status }
  return <Badge variant={variant}>{label}</Badge>
}

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const methods = {
    CASH: { icon: "💵", label: "Efectivo", className: "bg-green-100 text-green-800" },
    TRANSFER: { icon: "🏦", label: "Transferencia", className: "bg-blue-100 text-blue-800" },
    CARD: { icon: "💳", label: "Tarjeta", className: "bg-purple-100 text-purple-800" },
    ZELLE: { icon: "🌐", label: "Zelle", className: "bg-indigo-100 text-indigo-800" },
    PAYPAL: { icon: "🅿️", label: "PayPal", className: "bg-sky-100 text-sky-800" },
  }

  const { icon, label, className } = methods[method] || { 
    icon: "💱", 
    label: method,
    className: "bg-gray-100 text-gray-800"
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  )
}

interface PaymentTableProps {
  data: any[]
  pageCount: number
  currentPage: number
}

export function PaymentMethodsTable({ 
  data, 
  pageCount,
  currentPage
}: PaymentTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const columns: ColumnDef<any>[] = [
    {
      id: "expand",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setExpandedRow(expandedRow === row.id ? null : row.id)
          }}
          className="h-6 w-6 p-0"
        >
          {expandedRow === row.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 30,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {row.original.id?.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm">{row.original.client?.name || 'N/A'}</p>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{row.original.client?.document || ''}</span>
            {row.original.client?.whatsapp && (
              <a 
                href={`https://wa.me/${row.original.client.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-green-600"
              >
                <span>WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ row }) => {
        const currency = row.original.currencyType || 'USD'
        const amount = parseFloat(row.original.amount || 0)
        const pending = parseFloat(row.original.pendingAmount || 0)
        const conversionRate = parseFloat(row.original.conversionRate || 1)

        return (
          <div className="min-w-[120px]">
            <div className="font-medium text-sm">
              {formatCurrency(amount, currency)}
            </div>
            {currency === 'BS' && (
              <div className="text-xs text-muted-foreground">
                ≈ {formatCurrency(amount / conversionRate, 'USD')}
              </div>
            )}
            {pending > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                Pendiente: {formatCurrency(pending, currency)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Método",
      cell: ({ row }) => <PaymentMethodBadge method={row.original.paymentMethod || 'N/A'} />,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "paymentDate",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(new Date(row.original.paymentDate))}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: isMounted ? data : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!isMounted) return null

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0 border-none">
                    {expandedRow === row.id && (
                      <CardContent className="p-4 bg-muted/20">
                        <div className="grid gap-4">
                          <div>
                            <h4 className="text-sm font-semibold">Detalles de la Compra</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Estado de Compra</p>
                                <PaymentStatusBadge status={row.original.purchase?.status || 'N/A'} />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Tipo de Pago</p>
                                <p className="text-sm font-medium">{row.original.purchase?.paymentType || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Referencia</p>
                                <p className="text-sm font-mono">{row.original.transactionReference || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Notas</p>
                                <p className="text-sm font-medium">{row.original.notes || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          {row.original.purchaseDetails?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold">Artículos</h4>
                              <div className="grid gap-2 mt-2">
                                {row.original.purchaseDetails.map((detail: any, index: number) => (
                                  <div 
                                    key={index}
                                    className="p-2 rounded bg-background flex justify-between items-center"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {detail.inventoryItem?.name || 'N/A'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Cantidad: {detail.quantity}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">
                                        {formatCurrency(detail.totalPrice, row.original.purchase?.currencyType)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatCurrency(detail.unitPrice, row.original.purchase?.currencyType)} c/u
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <PaginationComponent 
        currentPage={currentPage}
        totalPages={pageCount}
        onPageChange={handlePageChange}
      />
    </div>
  )
}