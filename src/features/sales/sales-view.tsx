// components/sales-view.tsx
'use client'

import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText } from "lucide-react"
import Link from "next/link"

const columns = [
  {
    accessorKey: "id",
    header: "Referencia",
    cell: ({ row }) => (
      <div className="font-medium">
        <FileText className="inline mr-2 h-4 w-4" />
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "client",
    header: "Cliente",
    cell: ({ row }) => row.original.client.name,
  },
  {
    accessorKey: "purchaseDate",
    header: "Fecha",
    cell: ({ row }) => new Date(row.getValue("purchaseDate")).toLocaleDateString(),
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => `$${row.getValue("totalAmount")}`,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge 
        variant={
          row.getValue("status") === 'COMPLETED' ? 'default' :
          row.getValue("status") === 'PENDING' ? 'secondary' :
          'destructive'
        }
      >
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pago",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/sales/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
]

export function SalesView({ sales }) {
  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No hay ventas registradas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}