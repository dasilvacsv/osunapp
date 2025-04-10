import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2, Search, Check, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { createBeneficiary, updateBeneficiary } from "@/app/(app)/clientes/client"
import { getOrganizationSections } from "../organizations/actions"

const formSchema = z.object({
  clientId: z.string(),
  organizationId: z.string(),
  grade: z.string().min(1, "El grado es requerido"),
  section: z.string(),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  school: z.string().min(1, "La escuela es requerida"),
  level: z.string().min(1, "El nivel es requerido"),
})

type BeneficiaryFormData = z.infer<typeof formSchema>

interface Organization {
  id: string
  name: string
  type: string
}

interface OrganizationSection {
  id: string
  name: string
  level: string
}

interface BeneficiaryFormProps {
  clientId: string
  closeDialog: () => void
  initialData?: any
  mode: "create" | "edit"
  organizations?: Organization[]
}

export default function BeneficiaryForm({
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
  const [orgOpen, setOrgOpen] = useState(false)
  const [levelOpen, setLevelOpen] = useState(false)

  const form = useForm<BeneficiaryFormData>({
    resolver: zodResolver(formSchema),
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

  useEffect(() => {
    if (selectedOrganizationId && selectedOrganizationId !== "none") {
      const selectedOrg = organizations.find((org) => org.id === selectedOrganizationId)
      if (selectedOrg) {
        if (selectedOrg.type === "SCHOOL") {
          form.setValue("school", selectedOrg.name)
        }
      }

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
      const selectedOrg = organizations.find((org) => org.id === initialData?.organizationId)
      if (selectedOrg?.type === "SCHOOL") {
        form.setValue("school", "")
      }
    }
  }, [selectedOrganizationId, organizations, form, initialData])

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

  // Get unique levels from sections
  const uniqueLevels = Array.from(new Set(sections.map(section => section.level)))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="relative flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Apellidos</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apellidos"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nombres</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombres"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">Organización</FormLabel>
                  <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={orgOpen}
                          className={cn(
                            "w-full justify-between h-9 px-3 font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value && field.value !== "none"
                            ? organizations.find((org) => org.id === field.value)?.name
                            : "Seleccionar organización"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 shadow-md" align="start">
                      <Command className="max-h-[300px]">
                        <CommandInput placeholder="Buscar organización..." className="h-9" />
                        <CommandEmpty className="py-2 text-sm text-center">No se encontraron organizaciones.</CommandEmpty>
                        <CommandGroup className="overflow-y-auto">
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              form.setValue("organizationId", "none")
                              setOrgOpen(false)
                            }}
                            className="flex items-center py-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "none" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Ninguna
                          </CommandItem>
                          {organizations.map((org) => (
                            <CommandItem
                              key={org.id}
                              value={org.name}
                              onSelect={() => {
                                form.setValue("organizationId", org.id)
                                setOrgOpen(false)
                              }}
                              className="flex items-center py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === org.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {org.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Escuela</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre de la escuela"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-9"
                      disabled={
                        selectedOrganizationId !== "none" &&
                        organizations.find((org) => org.id === selectedOrganizationId)?.type === "SCHOOL"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nivel</FormLabel>
                    <Popover open={levelOpen} onOpenChange={setLevelOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoadingSections}
                            className={cn(
                              "w-full justify-between h-9 px-3 font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {isLoadingSections ? (
                              <span className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cargando...
                              </span>
                            ) : field.value || "Seleccionar nivel"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 shadow-md" align="start">
                        <Command className="max-h-[200px]">
                          <CommandInput placeholder="Buscar nivel..." className="h-9" />
                          <CommandEmpty className="py-2 text-sm text-center">
                            {sections.length === 0 
                              ? "Seleccione una organización primero"
                              : "No se encontraron niveles"}
                          </CommandEmpty>
                          <CommandGroup className="overflow-y-auto">
                            {uniqueLevels.map((level) => (
                              <CommandItem
                                key={level}
                                value={level}
                                onSelect={() => {
                                  form.setValue("level", level)
                                  setLevelOpen(false)
                                }}
                                className="flex items-center py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === level ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {level}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Grado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 3er grado"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Sección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: A"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-2 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={closeDialog}
            disabled={isSubmitting}
            className="transition-all duration-200 hover:bg-muted h-9"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 h-9"
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
        </div>
      </form>
    </Form>
  )
}