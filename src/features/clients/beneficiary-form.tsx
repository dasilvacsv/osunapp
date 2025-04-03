"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BeneficiaryFormData, createBeneficiary, updateBeneficiary } from "@/app/(app)/clientes/client"
import { Organization } from "@/lib/types"
import { getOrganizationSections } from "@/features/organizations/actions"

interface OrganizationSection {
  id: string
  name: string
  level: string
}

interface BeneficiaryFormProps {
  clientId: string;
  closeDialog: () => void;
  initialData?: any;
  mode: "create" | "edit";
  organizations?: Organization[]; // Hacer opcional
}

export function BeneficiaryForm({
  clientId,
  closeDialog,
  initialData,
  mode,
  organizations = [],
}: BeneficiaryFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sections, setSections] = useState<OrganizationSection[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)

  const form = useForm<BeneficiaryFormData>({
    defaultValues: {
      clientId: clientId,
      organizationId: initialData?.organizationId || "none",
      grade: initialData?.grade || "",
      section: initialData?.section || "",
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      school: initialData?.school || "",
      level: initialData?.level || "",
    },
  })

  const selectedOrganizationId = form.watch("organizationId")

  // Watch for organization changes to update school name and fetch sections
  useEffect(() => {
    if (selectedOrganizationId && selectedOrganizationId !== "none") {
      const selectedOrg = organizations.find(org => org.id === selectedOrganizationId)
      if (selectedOrg) {
        // Auto-populate school name if organization is a school
        if (selectedOrg.type === "SCHOOL") {
          form.setValue("school", selectedOrg.name)
        }
      }

      // Fetch organization sections
      const fetchSections = async () => {
        setIsLoadingSections(true)
        try {
          const result = await getOrganizationSections(selectedOrganizationId)
          if (result.data) {
            setSections(result.data)
          }
        } catch (error) {
          console.error("Error fetching sections:", error)
        } finally {
          setIsLoadingSections(false)
        }
      }

      fetchSections()
    } else {
      // Reset sections when no organization is selected
      setSections([])
      // Only reset school if it was previously auto-populated
      const selectedOrg = organizations.find(org => org.id === initialData?.organizationId)
      if (selectedOrg?.type === "SCHOOL") {
        form.setValue("school", "")
      }
    }
  }, [selectedOrganizationId, organizations, form])

  async function handleSubmit(data: BeneficiaryFormData) {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createBeneficiary(data)
        toast({
          title: "¡Éxito!",
          description: "Beneficiario creado correctamente",
        })
      } else {
        await updateBeneficiary(initialData.id, data)
        toast({
          title: "¡Éxito!",
          description: "Beneficiario actualizado correctamente",
        })
      }

      form.reset()
      closeDialog()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombres"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Apellidos"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organización</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Seleccionar organización" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {organizations?.map((org) => ( // Añadir operador opcional
  <SelectItem key={org.id} value={org.id}>
    {org.name}
  </SelectItem>
))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escuela</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de la escuela"
                    {...field}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    disabled={selectedOrganizationId !== "none" && organizations.find(org => org.id === selectedOrganizationId)?.type === "SCHOOL"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel</FormLabel>
                  {sections.length > 0 ? (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder={isLoadingSections ? "Cargando niveles..." : "Seleccionar nivel"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.level}>
                            {section.level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="Ej: Primaria"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 3er grado"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: A"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </motion.div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            type="button"
            onClick={closeDialog}
            disabled={isSubmitting}
            className="transition-all duration-200 hover:bg-muted"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creando..." : "Actualizando..."}
              </>
            ) : mode === "create" ? (
              "Crear"
            ) : (
              "Actualizar"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
} 