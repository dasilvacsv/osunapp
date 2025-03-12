"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input" 
import { Textarea } from "@/components/ui/textarea"
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OrganizationSelect, Organization } from "./organization-select"

interface OrganizationSelectFormProps {
  onSelect?: (organization: Organization) => void
  className?: string
  initialOrganizations: Organization[]
}

// Define form schema
const saleFormSchema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleFormSchema>

export function OrganizationSelectForm({ onSelect, className, initialOrganizations }: OrganizationSelectFormProps) {
  const router = useRouter()
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [formStep, setFormStep] = useState<"select-organization" | "create-sale">("select-organization")
  
  // Initialize form
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      organizationId: "",
      notes: "",
      referenceNumber: "",
    },
  })

  const handleOrganizationSelect = (organizationId: string, organization: Organization) => {
    setSelectedOrganizationId(organizationId)
    form.setValue("organizationId", organizationId)
    if (onSelect) {
      onSelect(organization)
    }
  }

  const onSubmit = async (values: SaleFormValues) => {
    console.log("Form submitted with values:", values)
    
    // Here you would typically:
    // 1. Call a server action to create the sale
    // 2. Navigate to the next step or sale details page
    
    // For now, just log the values and pretend we navigated
    alert(`Sale created for organization: ${values.organizationId}`)
    router.push("/sales")
  }

  // Continue to sale form after selecting an organization
  const continueToSaleForm = () => {
    if (selectedOrganizationId) {
      setFormStep("create-sale")
    }
  }

  // Render different content based on the current step
  if (formStep === "select-organization") {
    return (
      <OrganizationSelect
        initialOrganizations={initialOrganizations}
        selectedOrganizationId={selectedOrganizationId}
        onOrganizationSelect={handleOrganizationSelect}
        onContinue={continueToSaleForm}
        className={className}
      />
    )
  }
  
  // Create sale form (shown after organization selection)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Sale</CardTitle>
        <CardDescription>
          For {initialOrganizations.find(org => org.id === selectedOrganizationId)?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Sale reference or PO number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes for this sale" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormStep("select-organization")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Create Sale
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}