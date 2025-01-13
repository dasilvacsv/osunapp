// app/clients/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MessageSquare, MoreHorizontal, Pencil, Phone, Trash } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Client } from "@/lib/types"
import { useState } from "react"
import { EditClientDialog } from "./edit-dialog"


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

const ActionsCell = ({ client }: { client: Client }) => {
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
          <DropdownMenuItem onClick={() => console.log("Delete", client.id)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientDialog 
        client={client}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  )
}

export const columns: ColumnDef<Client>[] = [
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
    header: ({ column }) => <SortableHeader column={column} title="Nombre" />,
  },
  {
    accessorKey: "document",
    header: ({ column }) => <SortableHeader column={column} title="Cédula" />,
    cell: ({ row }) => {
      const document = row.getValue("document") as string | null;
      return document || "-";
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <SortableHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant="outline">
          {role}
        </Badge>
      )
    },
  },
  {
    id: "email",  // Added id for the email column
    accessorFn: (row) => row.contactInfo?.email,
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
  },
  {
    id: "phone",
    header: ({ column }) => <SortableHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.original.phone
      if (!phone) return "-"
      
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{phone}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => window.location.href = `tel:${phone}`}
          >
            <Phone className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      )
    },
  },
  {
    id: "whatsapp",
    header: ({ column }) => <SortableHeader column={column} title="WhatsApp" />,
    cell: ({ row }) => {
      const whatsapp = row.original.whatsapp
      if (!whatsapp) return "-"
      
      const formattedNumber = whatsapp.replace(/\D/g, '') // Remove non-digits
      const whatsappUrl = `https://wa.me/${formattedNumber}`
      
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{whatsapp}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            <MessageSquare className="h-4 w-4 text-green-600" />
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={status === "ACTIVE" ? "default" : "secondary"}  // Changed 'success' to 'default'
          className={status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell client={row.original} />
  }
]