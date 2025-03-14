"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { createOrganizationSection, updateOrganizationSection } from "./actions"
import { SectionFormData } from "@/lib/types"

interface OrganizationSectionFormProps {
  organizationId: string
  closeDialog: () => void
  initialData?: any
  mode: "create" | "edit"
}

export function OrganizationSectionForm({
  organizationId,
  closeDialog,
  initialData,
  mode,
}: OrganizationSectionFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SectionFormData>({
    defaultValues: {
      name: initialData?.name || "",
      level: initialData?.level || "",
      templateLink: initialData?.templateLink || "",
      templateStatus: initialData?.templateStatus || "PENDING",
    },
  })

  async function handleSubmit(data: SectionFormData) {
    if (isSubmitting) return

    // Convert empty templateLink to null for database
    const formattedData = {
      ...data,
      templateLink: data.templateLink || null,
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createOrganizationSection(organizationId, formattedData)
        toast({
          title: "¡Éxito!",
          description: "Sección creada correctamente",
        })
      } else {
        await updateOrganizationSection(initialData.id, formattedData)
        toast({
          title: "¡Éxito!",
          description: "Sección actualizada correctamente",
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de la sección"
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
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Preescolar, 5TO Año"
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
            name="templateLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enlace de Plantilla</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL de la plantilla"
                    {...field}
                    value={field.value || ""}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="templateStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de la Plantilla</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="COMPLETE">Completa</SelectItem>
                    <SelectItem value="INCOMPLETE">Incompleta</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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

