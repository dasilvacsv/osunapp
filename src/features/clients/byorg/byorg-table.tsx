'use client'

import React, { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table"
import { 
  ChevronRight, 
  ChevronDown,
  Users,
  UserCheck,
  UserX,
  Clock,
  Activity
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { organizationColumns, clientColumns } from "./columns"
import { Organization, OrganizationListData } from "./types"

interface OrganizationsTableProps {
  data: OrganizationListData
}

function ClientStats({ clients }: { clients: Organization['clients'] }) {
  const activeClients = clients.filter(c => c.status === 'ACTIVE').length
  const inactiveClients = clients.filter(c => c.status === 'INACTIVE').length
  const lastActivity = clients.length > 0 
    ? new Date(Math.max(...clients.map(c => new Date(c.updatedAt).getTime())))
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full p-3 bg-green-100 text-green-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Clients</p>
            <p className="text-2xl font-bold">{activeClients}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full p-3 bg-red-100 text-red-600">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactive Clients</p>
            <p className="text-2xl font-bold">{inactiveClients}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full p-3 bg-purple-100 text-purple-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Activity</p>
            <p className="text-sm font-medium">
              {lastActivity ? lastActivity.toLocaleDateString() : 'No activity'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ClientsSubTable({ clients }: { clients: Organization['clients'] }) {
  const table = useReactTable({
    data: clients,
    columns: clientColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <ClientStats clients={clients} />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
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
            <AnimatePresence>
              {table.getRowModel().rows.map((clientRow) => (
                <motion.tr
                  key={clientRow.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="hover:bg-muted/50"
                >
                  {clientRow.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function OrganizationsTable({ data }: OrganizationsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data: data.data,
    columns: organizationColumns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  })

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30px]" />
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
          <AnimatePresence>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`hover:bg-muted/50 ${
                      row.getIsExpanded() ? 'bg-muted/30' : ''
                    }`}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => row.toggleExpanded()}
                        className="hover:bg-muted"
                      >
                        {row.getIsExpanded() ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                  {row.getIsExpanded() && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <TableCell colSpan={row.getVisibleCells().length + 1}>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium">
                              Clients for {row.original.name}
                            </h3>
                            <Badge variant="outline">
                              {row.original.clients.length} Client(s)
                            </Badge>
                          </div>
                          {row.original.clients.length > 0 ? (
                            <ClientsSubTable clients={row.original.clients} />
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No clients found for this organization.
                            </p>
                          )}
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={organizationColumns.length + 1}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2" />
                    <p>No organizations found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
}