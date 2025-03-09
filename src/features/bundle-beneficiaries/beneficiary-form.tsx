"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getOrganizationSections } from "@/app/(app)/organizations/organization"

interface BeneficiaryFormData {
  firstName: string
  lastName: string
  school: string
  level: string
  section: string
  status: "ACTIVE" | "INACTIVE"
  organizationId?: string
}

interface BeneficiaryFormProps {
  initialData?: BeneficiaryFormData
  onSubmit: (data: BeneficiaryFormData) => Promise<void>
  closeDialog: () => void
  isSubmitting: boolean
  organizations?: { id: string; name: string }[]
}

interface OrganizationSection {
  id: string
  name: string
  level: string
}

export function BeneficiaryForm({
  initialData,
  onSubmit,
  closeDialog,
  isSubmitting,
  organizations = [],
}: BeneficiaryFormProps) {
  const [sections, setSections] = useState<OrganizationSection[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)

  const form = useForm<BeneficiaryFormData>({
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      school: initialData?.school || "",
      level: initialData?.level || "",
      section: initialData?.section || "",
      status: initialData?.status || "ACTIVE",
      organizationId: initialData?.organizationId || "",
    },
  })

  const selectedOrganizationId = form.watch("organizationId")

  useEffect(() => {
    if (selectedOrganizationId) {
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
      setSections([])
    }
  }, [selectedOrganizationId])

  async function handleSubmit(data: BeneficiaryFormData) {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre"
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
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apellido"
                    {...field}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {organizations.length > 0 && (
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
                    {organizations.map((org) => (
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
        )}

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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingSections ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Cargando niveles...</span>
                        </div>
                      ) : (
                        sections.map((section) => (
                          <SelectItem key={section.id} value={section.level}>
                            {section.level}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input
                      placeholder="Ej: Preescolar, 5TO Año"
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
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: A, B, C"
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                {initialData ? "Actualizando..." : "Creando..."}
              </>
            ) : initialData ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

