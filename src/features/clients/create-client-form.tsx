// create-client-form.tsx
'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DialogFooter } from "@/components/ui/dialog";
import { Client } from "@/lib/types";
import { ClientFormData, createClient, updateClient } from "@/app/(app)/clientes/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getOrganizations } from "@/app/(app)/clientes/client";

interface ClientFormProps {
  closeDialog: () => void;
  initialData?: Client;
  mode: 'create' | 'edit';
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export function ClientForm({ closeDialog, initialData, mode, onSubmit }: ClientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data } = await getOrganizations();
      setOrganizations(data || []);
    };
    fetchOrganizations();
  }, []);

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
      organizationId: initialData?.organizationId || undefined,
      role: (initialData?.role || "INDIVIDUAL") as "PARENT" | "EMPLOYEE" | "INDIVIDUAL",
    },
  });

  async function handleSubmit(data: ClientFormData) {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
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
                <Input placeholder="Enter name" {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}