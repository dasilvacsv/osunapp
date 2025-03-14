"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, FileText, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const SortableHeader = ({ column, title }: { column: any; title: string }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-muted transition-colors duration-200"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

const ActionsCell = ({
  organization,
  onUpdate,
  onDelete,
}: {
  organization: any
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors duration-200">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => onUpdate(organization.id, organization)}
          className="cursor-pointer transition-colors duration-200 hover:bg-muted"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.location.href = `/organizations/${organization.id}/sections`}
          className="cursor-pointer transition-colors duration-200 hover:bg-muted"
        >
          <FileText className="mr-2 h-4 w-4" />
          View Sections
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.location.href = `/organizations/${organization.id}/sections/new`}
          className="cursor-pointer transition-colors duration-200 hover:bg-muted"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(organization.id)}
          className="cursor-pointer text-destructive transition-colors duration-200 hover:bg-destructive/10"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const organizationColumns = (
  onUpdate: (id: string, data: any) => void,
  onDelete: (id: string) => void,
): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const typeLabels: Record<string, string> = {
        SCHOOL: "School",
        COMPANY: "Company",
        OTHER: "Other",
      }
      return (
        <Badge variant="outline" className="font-medium">
          {typeLabels[type] || type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "nature",
    header: ({ column }) => <SortableHeader column={column} title="Nature" />,
    cell: ({ row }) => {
      const nature = row.getValue("nature") as string
      const natureLabels: Record<string, string> = {
        PUBLIC: "Public",
        PRIVATE: "Private",
      }
      return (
        <Badge
          variant="outline"
          className={`font-medium ${nature === "PUBLIC" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : ""}`}
        >
          {natureLabels[nature] || nature || "Private"}
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
      const statusLabels: Record<string, string> = {
        ACTIVE: "Active",
        INACTIVE: "Inactive",
      }
      return (
        <Badge
          variant={status === "ACTIVE" ? "default" : "secondary"}
          className={`
            ${status === "ACTIVE" ? "bg-success/20 text-success dark:bg-success/30" : "bg-muted text-muted-foreground"}
            transition-all duration-200 hover:scale-105
          `}
        >
          {statusLabels[status] || status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell organization={row.original} onUpdate={onUpdate} onDelete={onDelete} />,
  },
]

