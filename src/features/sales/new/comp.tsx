// app/(dashboard)/events/components/EventsTable.tsx
"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getOrganizations } from "./actions"
import { Label } from "@/components/ui/label"
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

// Match the organization structure from the database schema
export interface Organization {
  id: string
  name: string
  type: "SCHOOL" | "COMPANY" | "OTHER"
  status: "ACTIVE" | "INACTIVE" | null
  address: string | null
  contactInfo: unknown
  nature: "PUBLIC" | "PRIVATE" | null
  createdAt: Date | null
  updatedAt: Date | null
  cityId: string | null
}

interface OrganizationSelectFormProps {
  onSelect?: (organization: Organization) => void
  className?: string
}

// Define form schema
const saleFormSchema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleFormSchema>

export function OrganizationSelectForm({ onSelect, className }: OrganizationSelectFormProps) {
  const router = useRouter()
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
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

  // Load organizations when component mounts
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true)
      try {
        const result = await getOrganizations()
        if (result.data) {
          setOrganizations(result.data)
        }
      } catch (error) {
        console.error("Failed to load organizations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, []) // Empty dependency array ensures this runs only once on mount

  const handleOrganizationChange = (value: string) => {
    setSelectedOrganizationId(value)
    form.setValue("organizationId", value)
    
    if (value && onSelect) {
      const selectedOrg = organizations.find(org => org.id === value)
      if (selectedOrg) {
        onSelect(selectedOrg)
      }
    }
  }

  const onSubmit = async (values: SaleFormValues) => {
    console.log("Form submitted with values:", values)
    
    // Here you would typically:
    // 1. Call a server action to create the sale
    // 2. Navigate to the next step or sale details page
    
    // For now, just log the values and pretend we navigated
    alert(`Sale created for organization: ${organizations.find(org => org.id === values.organizationId)?.name}`)
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>Select Organization</CardTitle>
          <CardDescription>Choose the organization for this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <PopoverSelect
                options={organizations.map(org => ({
                  label: `${org.name} (${org.type})`,
                  value: org.id
                }))}
                value={selectedOrganizationId}
                onValueChange={handleOrganizationChange}
                placeholder={loading ? "Loading organizations..." : "Select an organization"}
                disabled={loading}
                emptyMessage="No organizations found"
              />
            </div>
            
            {selectedOrganizationId && (
              <Button 
                type="button" 
                className="w-full"
                onClick={continueToSaleForm}
              >
                Continue with Selected Organization
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Create sale form (shown after organization selection)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Sale</CardTitle>
        <CardDescription>
          For {organizations.find(org => org.id === selectedOrganizationId)?.name}
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