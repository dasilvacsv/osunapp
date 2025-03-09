"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Edit, Trash, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BeneficiaryForm } from "./beneficiary-form"

interface Beneficiary {
  id: string
  firstName: string
  lastName: string
  school: string
  level: string
  section: string
  status: "ACTIVE" | "INACTIVE"
  isComplete: boolean
}

interface BeneficiaryListProps {
  beneficiaries: Beneficiary[]
  onAddBeneficiary: (data: any) => Promise<void>
  onUpdateBeneficiary: (id: string, data: any) => Promise<void>
  onDeleteBeneficiary: (id: string) => Promise<void>
}

export function BeneficiaryList({
  beneficiaries,
  onAddBeneficiary,
  onUpdateBeneficiary,
  onDeleteBeneficiary,
}: BeneficiaryListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (data: any) => {
    setIsSubmitting(true)
    try {
      await onAddBeneficiary(data)
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error adding beneficiary:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedBeneficiary) return

    setIsSubmitting(true)
    try {
      await onUpdateBeneficiary(selectedBeneficiary.id, data)
      setShowEditDialog(false)
      setSelectedBeneficiary(null)
    } catch (error) {
      console.error("Error updating beneficiary:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Beneficiarios</CardTitle>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Beneficiario
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Escuela</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaries.length > 0 ? (
                beneficiaries.map((beneficiary) => (
                  <TableRow
                    key={beneficiary.id}
                    className={!beneficiary.isComplete ? "bg-red-50 dark:bg-red-900/10" : ""}
                  >
                    <TableCell>
                      <div>
                        {beneficiary.firstName} {beneficiary.lastName}
                        {!beneficiary.isComplete && (
                          <div className="flex items-center mt-1 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Datos incompletos
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{beneficiary.school}</TableCell>
                    <TableCell>{beneficiary.level}</TableCell>
                    <TableCell>{beneficiary.section}</TableCell>
                    <TableCell>
                      <Badge
                        variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                          beneficiary.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : ""
                        }
                      >
                        {beneficiary.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBeneficiary(beneficiary)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => onDeleteBeneficiary(beneficiary.id)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay beneficiarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Añadir Beneficiario</DialogTitle>
          </DialogHeader>
          <BeneficiaryForm
            onSubmit={handleAdd}
            closeDialog={() => setShowAddDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Editar Beneficiario</DialogTitle>
          </DialogHeader>
          {selectedBeneficiary && (
            <BeneficiaryForm
              initialData={{
                firstName: selectedBeneficiary.firstName,
                lastName: selectedBeneficiary.lastName,
                school: selectedBeneficiary.school,
                level: selectedBeneficiary.level,
                section: selectedBeneficiary.section,
                status: selectedBeneficiary.status,
              }}
              onSubmit={handleUpdate}
              closeDialog={() => {
                setShowEditDialog(false)
                setSelectedBeneficiary(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

