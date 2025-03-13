// app/(dashboard)/events/components/EventsTable.tsx
"use client"

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OrganizationSelect, Organization } from "./selectors/organization-select";
import { CategorySelect, Category } from "./selectors/category-select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getBundleCategories } from "./actions";

// Define form schema
const formSchema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  categoryId: z.string().min(1, "Please select a category"),
  // Add other fields as needed
});

type FormValues = z.infer<typeof formSchema>;

interface TestComponentProps {
  organizations: Organization[];
  categories?: Category[];
}

export function TestComponent({ organizations, categories: initialCategories = [] }: TestComponentProps) {
  const { toast } = useToast();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: "",
      categoryId: "",
      // Add other default values as needed
    },
  });

  // Fetch categories if not provided
  useEffect(() => {
    if (initialCategories.length === 0) {
      fetchCategories();
    }
  }, [initialCategories.length]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await getBundleCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSelect = (organizationId: string, organization: Organization) => {
    setSelectedOrganizationId(organizationId);
    form.setValue("organizationId", organizationId);
  };

  const handleCategorySelect = (categoryId: string, category: Category) => {
    setSelectedCategoryId(categoryId);
    form.setValue("categoryId", categoryId);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Form submitted with values:", values);
      // Add your submission logic here
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
    
  return (
    <div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create New Bundle</CardTitle>
          <CardDescription>Select an organization and category for this bundle</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Organization Selection */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <OrganizationSelect
                        selectedOrganizationId={field.value}
                        onOrganizationSelect={handleOrganizationSelect}
                        initialOrganizations={organizations}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category Selection */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategorySelect
                        selectedCategoryId={field.value}
                        onCategorySelect={handleCategorySelect}
                        initialCategories={categories}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}