"use client"

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  RowSelectionState,
  ExpandedState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { columns } from "./columns"
import { InventoryItem } from "@/lib/types"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "./transaction-history"
import { getInventoryTransactions } from "./actions"
import { InventoryTransaction } from "./types"
import { Skeleton } from "@/components/ui/skeleton"

interface InventoryTableProps {
  data: InventoryItem[]
  onSelect?: (item: InventoryItem) => void
}

export function InventoryTable({ data, onSelect }: InventoryTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [transactions, setTransactions] = useState<Record<string, InventoryTransaction[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetchTransactions = async (itemId: string) => {
    if (transactions[itemId]) return

    setLoading((prev) => ({ ...prev, [itemId]: true }))
    const result = await getInventoryTransactions(itemId)
    if (result.success) {
      setTransactions((prev) => ({ ...prev, [itemId]: result.data }))
    }
    setLoading((prev) => ({ ...prev, [itemId]: false }))
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    state: {
      rowSelection,
      expanded,
    },
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              <TableHead className="w-[50px]"></TableHead>
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
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <>
                <TableRow key={row.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        row.toggleExpanded()
                        if (!row.getIsExpanded()) {
                          fetchTransactions(row.original.id)
                        }
                      }}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1}>
                      <div className="p-4">
                        {loading[row.original.id] ? (
                          <Skeleton className="h-[200px] w-full" />
                        ) : transactions[row.original.id] ? (
                          <TransactionHistory 
                            transactions={transactions[row.original.id]} 
                          />
                        ) : (
                          <div>No transaction history available</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 