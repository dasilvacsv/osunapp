"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, FileText, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { OrganizationSectionForm } from "./organization-section-form"
import { OrganizationSectionsList } from "./organization-sections-list"

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showSectionsDialog, setShowSectionsDialog] = useState(false)
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors duration-200">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => setShowEditDialog(true)}
            className="cursor-pointer transition-colors duration-200 hover:bg-muted"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowSectionsDialog(true)}
            className="cursor-pointer transition-colors duration-200 hover:bg-muted"
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver Secciones
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowAddSectionDialog(true)}
            className="cursor-pointer transition-colors duration-200 hover:bg-muted"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir Sección
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(organization.id)}
            className="cursor-pointer text-destructive transition-colors duration-200 hover:bg-destructive/10"
          >
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Editar Organización</DialogTitle>
          </DialogHeader>
          <OrganizationForm
            initialData={organization}
            mode="edit"
            closeDialog={() => setShowEditDialog(false)}
            onSubmit={async (data) => onUpdate(organization.id, data)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showSectionsDialog} onOpenChange={setShowSectionsDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Secciones de {organization.name}</DialogTitle>
          </DialogHeader>
          <OrganizationSectionsList organizationId={organization.id} onClose={() => setShowSectionsDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Añadir Sección a {organization.name}</DialogTitle>
          </DialogHeader>
          <OrganizationSectionForm
            organizationId={organization.id}
            mode="create"
            closeDialog={() => setShowAddSectionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export const organizationColumns = (
  onUpdate: (id: string, data: any) => void,
  onDelete: (id: string) => void,
): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
        className="transition-opacity duration-200 hover:opacity-80"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="transition-opacity duration-200 hover:opacity-80"
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
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const typeLabels: Record<string, string> = {
        SCHOOL: "Escuela",
        COMPANY: "Empresa",
        OTHER: "Otro",
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
    header: ({ column }) => <SortableHeader column={column} title="Naturaleza" />,
    cell: ({ row }) => {
      const nature = row.getValue("nature") as string
      const natureLabels: Record<string, string> = {
        PUBLIC: "Pública",
        PRIVATE: "Privada",
      }
      return (
        <Badge
          variant="outline"
          className={`font-medium ${nature === "PUBLIC" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : ""}`}
        >
          {natureLabels[nature] || nature || "Privada"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => <SortableHeader column={column} title="Dirección" />,
    cell: ({ row }) => {
      const address = row.getValue("address") as string
      return address || "-"
    },
  },
  {
    id: "email",
    accessorFn: (row) => row.contactInfo?.email,
    header: ({ column }) => <SortableHeader column={column} title="Correo" />,
    cell: ({ row }) => {
      const email = row.original.contactInfo?.email
      return email || "-"
    },
  },
  {
    id: "phone",
    accessorFn: (row) => row.contactInfo?.phone,
    header: ({ column }) => <SortableHeader column={column} title="Teléfono" />,
    cell: ({ row }) => {
      const phone = row.original.contactInfo?.phone
      return phone || "-"
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusLabels: Record<string, string> = {
        ACTIVE: "Activo",
        INACTIVE: "Inactivo",
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

