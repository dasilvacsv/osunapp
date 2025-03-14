'use client'
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

import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientFormData, createClient, getOrganizations, updateClient } from "@/app/(app)/clientes/client"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface ClientFormProps {
  closeDialog: () => void;
  initialData?: Client;
  mode: 'create' | 'edit';
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export function ClientForm({ closeDialog, initialData, mode, onSubmit }: ClientFormProps) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  useEffect(() => {
    const loadOrganizations = async () => {
      const result = await getOrganizations();
      if (result.data) setOrganizations(result.data);
    };
    loadOrganizations();
  }, []);

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
  });

  async function handleSubmit(data: ClientFormData) {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Si el valor es "none", establece organizationId como undefined o null
      const processedData = {
        ...data,
        organizationId: data.organizationId === "none" ? undefined : data.organizationId,
      };

      await onSubmit(processedData); // Usa el handler pasado por props
      
      toast({
        title: "Success",
        description: `Client ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });
      
      form.reset();
      closeDialog();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Document/ID</FormLabel>
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
                <FormLabel>Phone</FormLabel>
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
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
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
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
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
              <FormLabel>Organization</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem> {/* Cambia "" por "none" */}
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
          <Button 
            variant="outline" 
            type="button" 
            onClick={closeDialog}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create' : 'Update'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}