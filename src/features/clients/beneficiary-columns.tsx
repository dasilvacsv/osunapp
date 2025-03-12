"use client"

import { Beneficiary } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BeneficiaryForm } from "./beneficiary-form"
import { Organization } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface ViewBeneficiaryDialogProps {
  beneficiary: Beneficiary
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ViewBeneficiaryDialog({ beneficiary, open, onOpenChange }: ViewBeneficiaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Beneficiario</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{beneficiary.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Información Personal</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Nombre:</span>
                  <span className="text-sm">{beneficiary.firstName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Apellido:</span>
                  <span className="text-sm">{beneficiary.lastName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <span className="text-sm">
                    <Badge variant={beneficiary.status === "ACTIVE" ? "default" : "destructive"}>
                      {beneficiary.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Badge>
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Información Educativa</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Escuela:</span>
                  <span className="text-sm">{beneficiary.school || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Nivel:</span>
                  <span className="text-sm">{beneficiary.level || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Grado:</span>
                  <span className="text-sm">{beneficiary.grade || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sección:</span>
                  <span className="text-sm">{beneficiary.section || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Información Adicional</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Organización:</span>
                  <span className="text-sm">{beneficiary.organization?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fecha de creación:</span>
                  <span className="text-sm">{beneficiary.createdAt ? new Date(beneficiary.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

interface EditBeneficiaryDialogProps {
  beneficiary: Beneficiary
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: any) => void
  organizations: Organization[]
}

function EditBeneficiaryDialog({ 
  beneficiary, 
  open, 
  onOpenChange, 
  onUpdate,
  organizations
}: EditBeneficiaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Beneficiario</DialogTitle>
        </DialogHeader>
        <BeneficiaryForm
          clientId={beneficiary.clientId}
          closeDialog={() => onOpenChange(false)}
          initialData={beneficiary}
          mode="edit"
          organizations={organizations}
        />
      </DialogContent>
    </Dialog>
  )
}

const ActionsCell = ({ 
  beneficiary, 
  onUpdate, 
  onDelete,
  organizations 
}: { 
  beneficiary: Beneficiary
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void 
  organizations: Organization[]
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)

  const handleUpdate = (data: any) => {
    onUpdate(beneficiary.id, {
      ...data,
      id: beneficiary.id,
      status: beneficiary.status
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(beneficiary.id)}>
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBeneficiaryDialog 
        beneficiary={beneficiary}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={handleUpdate}
        organizations={organizations}
      />

      <ViewBeneficiaryDialog
        beneficiary={beneficiary}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />
    </>
  )
}

export const columns = (
  onUpdate: (id: string, data: any) => void,
  onDelete: (id: string) => void,
  organizations: Organization[]
): ColumnDef<Beneficiary>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "grade",
    header: "Grado",
    cell: ({ row }) => row.getValue("grade") || "N/A",
  },
  {
    accessorKey: "section",
    header: "Sección",
    cell: ({ row }) => row.getValue("section") || "N/A",
  },
  {
    accessorKey: "school",
    header: "Escuela",
    cell: ({ row }) => row.getValue("school") || "N/A",
  },
  {
    accessorKey: "organization.name",
    header: "Organización",
    cell: ({ row }) => {
      const beneficiary = row.original
      return beneficiary.organization?.name || "N/A"
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
          {status === "ACTIVE" ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      beneficiary={row.original} 
      onUpdate={onUpdate} 
      onDelete={onDelete}
      organizations={organizations}
    />,
  },
] 