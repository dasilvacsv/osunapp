"use client"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import type { Client } from "@/lib/types"
import { type ClientFormData, getOrganizations } from "@/app/(app)/clientes/client"
import { useEffect, useState } from "react"
import { Copy, Loader2 } from "lucide-react"

interface ClientFormProps {
  closeDialog: () => void
  initialData?: Client
  mode: "create" | "edit"
  onSubmit: (data: ClientFormData) => Promise<void>
}

export function ClientForm({ closeDialog, initialData, mode, onSubmit }: ClientFormProps) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [syncWhatsapp, setSyncWhatsapp] = useState(mode === "create")

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
      organizationId: initialData?.organizationId || "none", // Añade un valor predeterminado para organizationId
    },
  })

  // Observar el campo de teléfono para sincronizar con WhatsApp
  const phoneValue = useWatch({
    control: form.control,
    name: "phone",
  })

  // Sincronizar WhatsApp con teléfono cuando cambia el teléfono y syncWhatsapp está activo
  useEffect(() => {
    if (syncWhatsapp && phoneValue) {
      form.setValue("whatsapp", phoneValue)
    }
  }, [phoneValue, syncWhatsapp, form])

  // Función para copiar el número de teléfono al campo de WhatsApp
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
      // Si el valor es "none", establece organizationId como undefined o null
      const processedData = {
        ...data,
        organizationId: data.organizationId === "none" ? undefined : data.organizationId,
      }

      await onSubmit(processedData) // Usa el handler pasado por props

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
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
              <FormLabel>Documento/ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
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
                  <FormLabel>WhatsApp</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyPhoneToWhatsapp}
                      className="h-6 px-2 text-xs"
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
                        className="h-3 w-3"
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
                    onChange={(e) => {
                      field.onChange(e)
                      // Si el usuario edita manualmente el campo de WhatsApp, desactivar la sincronización
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
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="juan@ejemplo.com" {...field} />
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
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
            <FormItem>
              <FormLabel>Organización</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar una organización" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={closeDialog} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
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

