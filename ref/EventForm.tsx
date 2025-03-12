'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, PlusCircle, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createEvent, getEventDefaults, getNextEventCode } from './actions/event'
import { useRouter } from 'next/navigation'
import { EventFormValues, eventSchema } from './schemas'
import { EVENT_TYPES } from './constants'
import { EventSelect } from "./components/event-select"

// Types
interface EventFormProps {
  clientId?: number
  initialData: {
    clients: { id: number; name: string }[]
    vendors: { id: number; name: string }[]
    venues: { id: number; name: string; location: string; capacity: number }[]
    planners: { id: number; name: string; availability_status: string }[]
  }
  eventData?: {
    formatted_event_code?: string
  }
}

type Service = {
  id: number
  name: string
  price: number
}

export default function EventForm({ clientId, initialData, eventData }: EventFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [vendorServices, setVendorServices] = useState<Record<number, Service[]>>({})
  const [clients, setClients] = useState(initialData.clients)

  // Destructure event data to access formatted event code
  const { formatted_event_code } = eventData || {};
  
  // Get data from initialData
  const venues = initialData.venues || []
  const vendors = initialData.vendors || []
  const planners = initialData.planners || []

  // In EventForm.tsx, update defaultValues
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      client_id: clientId || undefined,
      name: "",
      event_code: "",
      location: "",
      description: "",
      budget: undefined,
      status: "draft",
      event_type: undefined,
      venue_id: undefined,
      venue_details: {
        setup_notes: "",
        breakdown_notes: "",
        special_instructions: "",
        venue_requirements: []
      },
      guest_count: {
        sections: []
      },
      planners: [],
      vendors: []
    },
  })

  useEffect(() => {
    const loadDefaults = async () => {
      if (clientId) {
        const defaults = await getEventDefaults(clientId)
        if (defaults) {
          form.reset({ ...form.getValues(), ...defaults })
        }
      }
    }
    
    loadDefaults()
  }, [clientId, form])

  // Load the next event code when creating a new event
  useEffect(() => {
    // Only load next event code if we're creating a new event (not editing)
    if (!eventData) {
      const loadNextEventCode = async () => {
        const { data: nextCode, error } = await getNextEventCode();
        if (nextCode && !error) {
          form.setValue('event_code', nextCode);
        }
      };
      
      loadNextEventCode();
    }
  }, [form, eventData]);

   // Fetch vendor services when a vendor is selected
   const fetchVendorServices = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/services`)
      const data = await response.json()
      setVendorServices(prev => ({
        ...prev,
        [vendorId]: data
      }))
    } catch (error) {
      console.error('Error fetching vendor services:', error)
    }
  }

  async function onSubmit(values: EventFormValues) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await createEvent(values)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.push(`/events/${result.data.id}`)
        router.refresh()
      }
    } catch (error) {
      setError('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const addVendor = () => {
    const currentVendors = form.getValues("vendors")
    form.setValue("vendors", [
      ...currentVendors,
      {
        vendor_id: 0,
        included_in_timeline: false,
        services: []
      }
    ])
  }

  const removeVendor = (index: number) => {
    const currentVendors = form.getValues("vendors")
    form.setValue("vendors", currentVendors.filter((_, i) => i !== index))
  }

  const addService = (vendorIndex: number) => {
    const currentVendors = form.getValues("vendors")
    const vendorServices = currentVendors[vendorIndex].services || []
    
    currentVendors[vendorIndex].services = [
      ...vendorServices,
      {
        vendor_service_id: 0,
        quantity: 1,
        total_price: 0,
        notes: ""
      }
    ]
    
    form.setValue("vendors", currentVendors)
  }

  const removeService = (vendorIndex: number, serviceIndex: number) => {
    const currentVendors = form.getValues("vendors")
    currentVendors[vendorIndex].services = currentVendors[vendorIndex].services
      .filter((_, i) => i !== serviceIndex)
    form.setValue("vendors", currentVendors)
  }

  const addPlanner = () => {
    const currentPlanners = form.getValues('planners') || [];
    form.setValue('planners', [
      ...currentPlanners,
      { 
        planner_id: 0, 
        role: '', 
        start_date: undefined, 
        end_date: undefined,
        notes: ''
      }
    ]);
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{eventData ? 'Update Event' : 'Create New Event'}</CardTitle>
            <CardDescription>
              {eventData ? 'Update the details for this event.' : 'Fill in the details for your new event.'}
            </CardDescription>
          </div>
          {eventData?.formatted_event_code && (
            <div className="bg-primary/10 text-primary font-semibold py-1 px-3 rounded-md">
              {eventData.formatted_event_code}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50">
            <AlertDescription>Event created successfully!</AlertDescription>
          </Alert>
        )}

<Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <EventSelect
                      options={clients.map(client => ({
                        label: client.name,
                        value: client.id.toString()
                      }))}
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      placeholder="Select a client"
                      showAddClient={!clientId}
                      onClientAdded={(newClient) => {
                        setClients([...clients, newClient])
                        field.onChange(newClient.id)
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 101 (without EV prefix)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pre-populated with the next available code. You can change it if needed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

<FormField
  control={form.control}
  name="event_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Event Type</FormLabel>
      <Select
        onValueChange={field.onChange}
        value={field.value}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select event type" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(EVENT_TYPES).map(([key, value]) => (
            <SelectItem key={value} value={value}>
              {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter event budget"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter event description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

<FormField
  control={form.control}
  name="venue_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Venue</FormLabel>
      <Select
        onValueChange={(value) => field.onChange(parseInt(value))}
        value={field.value?.toString()}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select venue" />
        </SelectTrigger>
        <SelectContent>
          {initialData.venues.map((venue) => (
            <SelectItem key={venue.id} value={venue.id.toString()}>
              {venue.name} - {venue.location} (Capacity: {venue.capacity})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

{form.watch('venue_id') && (
  <Card className="p-4">
    <CardHeader>
      <CardTitle>Venue Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <FormField
        control={form.control}
        name="venue_details.setup_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Setup Notes</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Enter setup notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="venue_details.breakdown_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Breakdown Notes</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Enter breakdown notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="venue_details.special_instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Instructions</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Enter special instructions" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </CardContent>
  </Card>
)}

{/* Guest Count Section */}
<Card className="p-4">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Guest Count</CardTitle>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const currentSections = form.getValues('guest_count.sections') || [];
          form.setValue('guest_count.sections', [
            ...currentSections,
            { name: '', count: 0 }
          ]);
        }}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {form.watch('guest_count.sections')?.map((section, index) => (
      <div key={index} className="flex gap-4 items-start mb-4">
        <Input
          placeholder="Section name (e.g., Adults, Kids)"
          value={section.name}
          onChange={(e) => {
            const sections = form.getValues('guest_count.sections');
            sections[index].name = e.target.value;
            form.setValue('guest_count.sections', sections);
          }}
          className="flex-1"
        />
        <Input
          type="number"
          placeholder="Count"
          value={section.count}
          onChange={(e) => {
            const sections = form.getValues('guest_count.sections');
            sections[index].count = parseInt(e.target.value);
            form.setValue('guest_count.sections', sections);
          }}
          className="w-32"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const sections = form.getValues('guest_count.sections');
            form.setValue('guest_count.sections', 
              sections.filter((_, i) => i !== index)
            );
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ))}
  </CardContent>
</Card>

{/* Planners Section */}
<Card className="p-4">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Event Planners</CardTitle>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPlanner}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Planner
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {form.watch('planners')?.map((planner, index) => (
      <div key={index} className="grid grid-cols-2 gap-4 mb-4">
        <EventSelect
          options={initialData.planners.map(p => ({
            label: p.name,
            value: p.id.toString()
          }))}
          value={planner.planner_id?.toString()}
          onValueChange={(value) => {
            const planners = form.getValues('planners') || [];
            if (planners[index]) {
              planners[index].planner_id = parseInt(value);
              form.setValue('planners', planners);
            }
          }}
        />

        <EventSelect
          options={[
            { label: 'Lead Planner', value: 'lead' },
            { label: 'Assistant Planner', value: 'assistant' },
            { label: 'Coordinator', value: 'coordinator' },
            { label: 'Specialist', value: 'specialist' }
          ]}
          value={planner.role}
          onValueChange={(value) => {
            const planners = form.getValues('planners') || [];
            if (planners[index]) {
              planners[index].role = value;
              form.setValue('planners', planners);
            }
          }}
          placeholder="Select role"
        />

        <div className="col-span-2 flex gap-4">
          <FormField
            control={form.control}
            name={`planners.${index}.start_date`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`planners.${index}.end_date`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const planners = form.getValues('planners');
            form.setValue('planners', 
              planners.filter((_, i) => i !== index)
            );
          }}
          className="col-span-2"
        >
          <X className="h-4 w-4 mr-2" />
          Remove Planner
        </Button>
      </div>
    ))}
  </CardContent>
</Card>

<div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Vendors</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVendor}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </div>


                
                {form.watch("vendors").map((vendor, vendorIndex) => (
                  <Card key={vendorIndex} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                        <Select
                          value={vendor.vendor_id.toString()}
                          onValueChange={(value) => {
                            const currentVendors = form.getValues("vendors")
                            currentVendors[vendorIndex].vendor_id = parseInt(value)
                            form.setValue("vendors", currentVendors)
                            fetchVendorServices(parseInt(value))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {initialData.vendors.map((v) => (
                              <SelectItem key={v.id} value={v.id.toString()}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVendor(vendorIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`vendors.${vendorIndex}.included_in_timeline`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Include in timeline
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm">Services</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addService(vendorIndex)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>

                      {vendor.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="flex gap-4 items-start">
                          <div className="flex-1">
                            <Select
                              value={service.vendor_service_id.toString()}
                              onValueChange={(value) => {
                                const currentVendors = form.getValues("vendors")
                                currentVendors[vendorIndex].services[serviceIndex].vendor_service_id = parseInt(value)
                                form.setValue("vendors", currentVendors)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {vendorServices[vendor.vendor_id]?.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name} (${s.price})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            type="number"
                            placeholder="Qty"
                            className="w-24"
                            value={service.quantity}
                            onChange={(e) => {
                              const currentVendors = form.getValues("vendors")
                              currentVendors[vendorIndex].services[serviceIndex].quantity = parseInt(e.target.value)
                              form.setValue("vendors", currentVendors)
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            className="w-32"
                            value={service.total_price}
                            onChange={(e) => {
                              const currentVendors = form.getValues("vendors")
                              currentVendors[vendorIndex].services[serviceIndex].total_price = parseFloat(e.target.value)
                              form.setValue("vendors", currentVendors)
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(vendorIndex, serviceIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}