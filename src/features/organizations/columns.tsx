import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"

const SortableHeader = ({ column, title }: { column: any; title: string }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

const ActionsCell = ({ 
  organization, 
  onUpdate, 
  onDelete 
}: { 
  organization: any
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void 
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(organization.id)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <OrganizationForm
            initialData={organization}
            mode="edit"
            closeDialog={() => setShowEditDialog(false)}
            onSubmit={async (data) => onUpdate(organization.id, data)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export const organizationColumns = (
  onUpdate: (id: string, data: any) => void,
  onDelete: (id: string) => void
): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant="outline">
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => <SortableHeader column={column} title="Address" />,
    cell: ({ row }) => {
      const address = row.getValue("address") as string
      return address || "-"
    },
  },
  {
    id: "email",
    accessorFn: (row) => row.contactInfo?.email,
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const email = row.original.contactInfo?.email
      return email || "-"
    },
  },
  {
    id: "phone",
    accessorFn: (row) => row.contactInfo?.phone,
    header: ({ column }) => <SortableHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.original.contactInfo?.phone
      return phone || "-"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={status === "ACTIVE" ? "default" : "secondary"}
          className={status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell organization={row.original} onUpdate={onUpdate} onDelete={onDelete} />
  }
]