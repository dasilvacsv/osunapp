"use client"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Client } from "@/lib/types"
import { type ClientFormData, getOrganizations } from "@/app/(app)/clientes/client"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Copy, Loader2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientFormProps {
  closeDialog: () => void
  initialData?: Client
  mode: "create" | "edit"
  onSubmit: (data: ClientFormData) => Promise<void>
}

export function ClientForm({ closeDialog, initialData, mode, onSubmit }: ClientFormProps) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [syncWhatsapp, setSyncWhatsapp] = useState(mode === "create")
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    const loadOrganizations = async () => {
      const result = await getOrganizations()
      if (result.data) setOrganizations(result.data)
    }
    loadOrganizations()
  }, [])

  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientFormData>({
    defaultValues: {
      name: initialData?.name || "",
      document: initialData?.document || "",
      phone: initialData?.phone || "",
      whatsapp: initialData?.whatsapp || "",
      contactInfo: {
        email: initialData?.contactInfo?.email || "",
        phone: initialData?.contactInfo?.phone || "",
      },
      role: (initialData?.role || "INDIVIDUAL") as "PARENT" | "EMPLOYEE" | "INDIVIDUAL",
      organizationId: initialData?.organizationId || "none",
    },
  })

  const phoneValue = useWatch({
    control: form.control,
    name: "phone",
  })

  useEffect(() => {
    if (syncWhatsapp && phoneValue) {
      form.setValue("whatsapp", phoneValue)
    }
  }, [phoneValue, syncWhatsapp, form])

  const copyPhoneToWhatsapp = () => {
    const phoneNumber = form.getValues("phone")
    if (phoneNumber) {
      form.setValue("whatsapp", phoneNumber)
      toast({
        title: "Copiado",
        description: "Número de teléfono copiado a WhatsApp",
        duration: 2000,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay número de teléfono para copiar",
        duration: 2000,
      })
    }
  }

  async function handleSubmit(data: ClientFormData) {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const processedData = {
        ...data,
        organizationId: data.organizationId === "none" ? undefined : data.organizationId,
      }

      await onSubmit(processedData)

      toast({
        title: "Éxito",
        description: `Cliente ${mode === "create" ? "creado" : "actualizado"} correctamente`,
      })

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

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
        <DialogTitle className="text-xl flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
        </DialogTitle>
        <DialogDescription className="text-sm mt-1">
          Complete los datos del cliente. Todos los campos marcados con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto flex-1 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Juan Pérez" 
                        {...field} 
                        className="bg-background focus:ring-2 focus:ring-blue-500" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Documento/ID *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456789" 
                        {...field} 
                        className="bg-background focus:ring-2 focus:ring-blue-500" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Teléfono *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890" 
                          {...field} 
                          className="bg-background focus:ring-2 focus:ring-blue-500" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-sm font-medium">WhatsApp</FormLabel>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyPhoneToWhatsapp}
                            className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar teléfono
                          </Button>
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              id="sync-whatsapp"
                              checked={syncWhatsapp}
                              onChange={(e) => setSyncWhatsapp(e.target.checked)}
                              className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="sync-whatsapp" className="text-xs text-muted-foreground">
                              Sincronizar
                            </label>
                          </div>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          {...field}
                          className="bg-background focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                            field.onChange(e)
                            if (syncWhatsapp && e.target.value !== phoneValue) {
                              setSyncWhatsapp(false)
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactInfo.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Correo electrónico *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="juan@ejemplo.com" 
                        {...field} 
                        className="bg-background focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Rol *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PARENT">Padre/Madre</SelectItem>
                        <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Organización</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between bg-background focus:ring-2 focus:ring-blue-500",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value === "none"
                              ? "Seleccionar organización"
                              : organizations.find((org) => org.id === field.value)?.name || "Ninguna"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar organización..."
                            onValueChange={setSearchValue}
                          />
                          <CommandEmpty>No se encontraron organizaciones.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                form.setValue("organizationId", "none")
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === "none" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Ninguna
                            </CommandItem>
                            {filteredOrganizations.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={org.name}
                                onSelect={() => {
                                  form.setValue("organizationId", org.id)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === org.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {org.name} ({org.type})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <p className="text-xs text-blue-800">
                  Nota: Al crear un cliente, se generará un perfil único en nuestro sistema. 
                  Asegúrese de que todos los datos sean correctos antes de continuar.
                </p>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <DialogFooter className="flex space-x-2 mt-1 px-6 py-4 border-t flex-shrink-0">
        <Button
          variant="outline"
          onClick={closeDialog}
          disabled={isSubmitting}
          className="flex-1 text-sm hover:bg-blue-50 hover:text-blue-600"
        >
          Cancelar
        </Button>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creando..." : "Actualizando..."}
            </>
          ) : mode === "create" ? (
            "Crear Cliente"
          ) : (
            "Actualizar Cliente"
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}