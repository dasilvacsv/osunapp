"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { CityFormData } from "@/app/(app)/cities/actions"

interface CityFormProps {
  closeDialog: () => void
  initialData?: {
    name: string
    state?: string
    country: string
  }
  onSubmit: (data: CityFormData) => Promise<void>
  isSubmitting: boolean
}

export function CityForm({ closeDialog, initialData, onSubmit, isSubmitting }: CityFormProps) {
  const form = useForm<CityFormData>({
    defaultValues: {
      name: initialData?.name || "",
      state: initialData?.state || "",
      country: initialData?.country || "Venezuela",
    },
  })

  async function handleSubmit(data: CityFormData) {
    await onSubmit(data)
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
                <Input
                  placeholder="Nombre de la ciudad"
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
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado/Provincia</FormLabel>
              <FormControl>
                <Input
                  placeholder="Estado o provincia"
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
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input
                  placeholder="País"
                  {...field}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </FormControl>
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

