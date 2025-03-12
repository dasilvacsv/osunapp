'use client'

import React, { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { columns } from "./beneficiary-columns"
import { Input } from "@/components/ui/input"
import { Beneficiary, Organization } from "@/lib/types"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BeneficiaryForm } from "./beneficiary-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BeneficiaryTableProps {
  beneficiaries: Beneficiary[]
  isLoading: boolean
  onUpdateBeneficiary: (id: string, data: any) => void
  onDeleteBeneficiary: (id: string) => void
  onCreateBeneficiary: (data: any) => void
  clientId: string
  organizations: Organization[]
}

export function BeneficiaryTable({
  beneficiaries,
  isLoading,
  onUpdateBeneficiary,
  onDeleteBeneficiary,
  onCreateBeneficiary,
  clientId,
  organizations,
}: BeneficiaryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const table = useReactTable({
    data: beneficiaries,
    columns: columns(onUpdateBeneficiary, onDeleteBeneficiary, organizations),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const handleCreateBeneficiary = (data: any) => {
    onCreateBeneficiary(data)
    setShowCreateDialog(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Beneficiarios</CardTitle>
          <CardDescription>
            Gestione los beneficiarios asociados a este cliente
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtrar por nombre..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns(onUpdateBeneficiary, onDeleteBeneficiary, organizations).length}
                    className="h-24 text-center"
                  >
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                  <TableCell
                    colSpan={columns(onUpdateBeneficiary, onDeleteBeneficiary, organizations).length}
                    className="h-24 text-center"
                  >
                    No hay beneficiarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar Beneficiario</DialogTitle>
          </DialogHeader>
          <BeneficiaryForm
            clientId={clientId}
            closeDialog={() => setShowCreateDialog(false)}
            mode="create"
            organizations={organizations}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
} 