'use client'

import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  VisibilityState,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { organizationColumns } from "./columns"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface OrganizationTableProps {
  organizations: any[]
  isLoading: boolean
  onUpdateOrganization: (id: string, data: any) => void
  onDeleteOrganization: (id: string) => void
  selectedOrganizations: string[]
  setSelectedOrganizations: React.Dispatch<React.SetStateAction<string[]>>
  onSelectOrganization: (org: any) => void
  selectedOrganization: any
}

export function OrganizationTable({
  organizations,
  isLoading,
  onUpdateOrganization,
  onDeleteOrganization,
  selectedOrganizations,
  setSelectedOrganizations,
  onSelectOrganization,
  selectedOrganization,
}: OrganizationTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data: organizations,
    columns: organizationColumns(onUpdateOrganization, onDeleteOrganization),
    state: {
      sorting,
      columnVisibility,
      rowSelection: Object.fromEntries(selectedOrganizations.map(id => [id, true])),
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      if (typeof updater === 'function') {
        setSelectedOrganizations(current => {
          const newSelection = updater(Object.fromEntries(current.map(id => [id, true])))
          return Object.entries(newSelection)
            .filter(([, selected]) => selected)
            .map(([id]) => id)
        })
      }
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center py-4">
        <Input
          placeholder="Search organizations..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`
                    transition-colors hover:bg-muted/50 group cursor-pointer
                    ${row.original.id === selectedOrganization?.id ? 'bg-muted' : ''}
                  `}
                  onClick={() => onSelectOrganization(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="group-hover:text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={table.getAllColumns().length} 
                  className="h-24 text-center text-muted-foreground"
                >
                  No organizations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}