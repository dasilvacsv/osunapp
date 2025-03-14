"use client"

import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Edit, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditDialog } from "./edit-dialog"

// Define the data type
type Person = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
}

// Sample data
const data: Person[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Developer",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Designer",
    status: "active",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Manager",
    status: "inactive",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "Developer",
    status: "active",
  },
  {
    id: "5",
    name: "Charlie Wilson",
    email: "charlie@example.com",
    role: "Designer",
    status: "inactive",
  },
]

export function InteractiveTable() {
  const [tableData, setTableData] = useState<Person[]>(data)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })

  // Define columns
  const columns: ColumnDef<Person>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span
            className={`h-2 w-2 rounded-full mr-2 ${row.original.status === "active" ? "bg-green-500" : "bg-red-500"}`}
          />
          {row.original.status}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const person = row.original

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    // Calculate position for the dialog
                    const rect = e.currentTarget.getBoundingClientRect()
                    setDialogPosition({
                      x: rect.left,
                      y: rect.bottom + window.scrollY,
                    })
                    setEditingPerson(person)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleSave = (updatedPerson: Person) => {
    setTableData((prev) => prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)))
    setEditingPerson(null)
  }

  return (
    <div className="relative">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      {/* Edit Dialog - positioned absolutely */}
      {editingPerson && (
        <EditDialog
          person={editingPerson}
          onSave={handleSave}
          onCancel={() => setEditingPerson(null)}
          position={dialogPosition}
        />
      )}
    </div>
  )
}

