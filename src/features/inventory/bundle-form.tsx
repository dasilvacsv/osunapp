'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { InventoryItem } from "./types"
import { formatCurrency } from "@/lib/utils"
import { bundleSchema } from "@/features/inventory/validation"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface BundleFormProps {
  categoryId: string
  items: InventoryItem[]
  onSubmit: (data: any) => Promise<void>
}

export function BundleForm({ categoryId, items, onSubmit }: BundleFormProps) {
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { quantity: number; overridePrice?: number }
  }>({})

  const form = useForm({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId,
      items: [],
      totalBasePrice: 0,
      savingsPercentage: 0,
    },
  })

  const totalBasePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    const item = items.find(i => i.id === itemId)
    return acc + (item?.basePrice || 0) * data.quantity
  }, 0)

  const totalOverridePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    return acc + (data.overridePrice || 0) * data.quantity
  }, 0)

  const savings = totalBasePrice - totalOverridePrice
  const savingsPercentage = (savings / totalBasePrice) * 100

  const handleSubmit = async (formData: any) => {
    const bundleData = {
      ...formData,
      items: Object.entries(selectedItems).map(([itemId, data]) => ({
        itemId,
        quantity: data.quantity,
        overridePrice: data.overridePrice,
      })),
      totalBasePrice,
      savingsPercentage: (savings / totalBasePrice) * 100,
    }

    await onSubmit(bundleData)
  }

  const ItemSelector = ({ items, onSelect }: { 
    items: InventoryItem[], 
    onSelect: (item: InventoryItem) => void 
  }) => {
    const [open, setOpen] = useState(false)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            Select an item to add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search items..." />
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  <span>{item.name}</span>
                  <span className="ml-2 text-gray-500">
                    ({formatCurrency(item.basePrice)})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bundle Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Bundle Items</h3>
          
          <ItemSelector 
            items={items.filter(item => !selectedItems[item.id])}
            onSelect={(item) => {
              setSelectedItems(prev => ({
                ...prev,
                [item.id]: { quantity: 1 }
              }))
            }}
          />
          
          <div className="space-y-4 mt-4">
            {items.map(item => {
              const itemData = selectedItems[item.id]
              return (
                <div key={item.id} className="flex items-center gap-4 p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Base Price: {formatCurrency(item.basePrice)}</p>
                  </div>
                  
                  <Input 
                    type="number"
                    className="w-20"
                    placeholder="Qty"
                    value={itemData?.quantity || ''}
                    onChange={e => {
                      const qty = parseInt(e.target.value)
                      if (qty > 0) {
                        setSelectedItems(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], quantity: qty }
                        }))
                      } else {
                        setSelectedItems(prev => {
                          const { [item.id]: _, ...rest } = prev
                          return rest
                        })
                      }
                    }}
                  />
                  
                  <Input
                    type="number"
                    className="w-32"
                    placeholder="Override Price"
                    value={itemData?.overridePrice || ''}
                    onChange={e => {
                      const price = parseFloat(e.target.value)
                      if (price >= 0) {
                        setSelectedItems(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], overridePrice: price }
                        }))
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Base Price:</p>
              <p className="font-semibold">{formatCurrency(totalBasePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bundle Price:</p>
              <p className="font-semibold">{formatCurrency(totalOverridePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Savings:</p>
              <p className="font-semibold text-green-600">{formatCurrency(savings)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Savings Percentage:</p>
              <p className="font-semibold text-green-600">{savingsPercentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <Button type="submit">Create Bundle</Button>
      </form>
    </Form>
  )
} 