import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface OrganizationFormData {
  name: string
  type: "ESCUELA" | "EMPRESA" | "OTRO"
  address?: string
  contactInfo: {
    email?: string
    phone?: string
  }
}

interface OrganizationFormProps {
  closeDialog: () => void
  initialData?: any
  mode: 'create' | 'edit'
  onSubmit: (data: OrganizationFormData) => Promise<void>
}

export function OrganizationForm({ closeDialog, initialData, mode, onSubmit }: OrganizationFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<OrganizationFormData>({
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "EMPRESA",
      address: initialData?.address || "",
      contactInfo: {
        email: initialData?.contactInfo?.email || "",
        phone: initialData?.contactInfo?.phone || "",
      },
    },
  })

  async function handleSubmit(data: OrganizationFormData) {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      
      toast({
        title: "¡Éxito!",
        description: `Organización ${mode === 'create' ? 'creada' : 'actualizada'} correctamente`,
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
                    placeholder="Nombre de la organización" 
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Seleccionar tipo de organización" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ESCUELA">Escuela</SelectItem>
                    <SelectItem value="EMPRESA">Empresa</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Dirección de la organización" 
                    {...field}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactInfo.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="contacto@organizacion.com" 
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
            name="contactInfo.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+34123456789" 
                    {...field}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </FormControl>
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
            className="transition-all duration-200 hover:bg-gray-100"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creando...' : 'Actualizando...'}
              </>
            ) : (
              mode === 'create' ? 'Crear' : 'Actualizar'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}