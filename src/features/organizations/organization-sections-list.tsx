"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash, Plus, FileText, ExternalLink, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { OrganizationSectionForm } from "./organization-section-form"
import { getOrganizationSections, deleteOrganizationSection } from "@/app/(app)/organizations/organization"

interface OrganizationSection {
  id: string
  name: string
  level: string
  templateLink: string | null
  templateStatus: "COMPLETE" | "INCOMPLETE" | "PENDING"
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

interface OrganizationSectionsListProps {
  organizationId: string
  onClose: () => void
}

export function OrganizationSectionsList({ organizationId, onClose }: OrganizationSectionsListProps) {
  const { toast } = useToast()
  const [sections, setSections] = useState<OrganizationSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSection, setSelectedSection] = useState<OrganizationSection | null>(null)

  useEffect(() => {
    fetchSections()
  }, [organizationId])

  const fetchSections = async () => {
    setIsLoading(true)
    try {
      const result = await getOrganizationSections(organizationId)
      if (result.data) {
        setSections(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las secciones",
        })
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar las secciones",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (section: OrganizationSection) => {
    setSelectedSection(section)
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganizationSection(id)
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Sección eliminada correctamente",
        })
        setSections(sections.filter((section) => section.id !== id))
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la sección",
        })
      }
    } catch (error) {
      console.error("Error deleting section:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al eliminar la sección",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completa</Badge>
      case "INCOMPLETE":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Incompleta</Badge>
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pendiente</Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{sections.length} secciones encontradas</div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Sección
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hay secciones</h3>
          <p className="text-sm text-muted-foreground mt-1">Esta organización no tiene secciones configuradas</p>
          <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Añadir primera sección
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Estado Plantilla</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow
                  key={section.id}
                  className={section.templateStatus === "INCOMPLETE" ? "bg-red-50 dark:bg-red-900/10" : ""}
                >
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>{section.level}</TableCell>
                  <TableCell>
                    {getStatusBadge(section.templateStatus)}
                    {section.templateStatus === "INCOMPLETE" && (
                      <div className="flex items-center mt-1 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Datos incompletos
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {section.templateLink ? (
                      <a
                        href={section.templateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        Ver plantilla
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">No disponible</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(section)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(section.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Añadir Nueva Sección</DialogTitle>
          </DialogHeader>
          <OrganizationSectionForm
            organizationId={organizationId}
            mode="create"
            closeDialog={() => {
              setShowAddDialog(false)
              fetchSections()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Editar Sección</DialogTitle>
          </DialogHeader>
          <OrganizationSectionForm
            organizationId={organizationId}
            mode="edit"
            initialData={selectedSection}
            closeDialog={() => {
              setShowEditDialog(false)
              setSelectedSection(null)
              fetchSections()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

