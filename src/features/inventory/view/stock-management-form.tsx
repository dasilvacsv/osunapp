'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Package2, Plus, Minus, Save, RefreshCw } from 'lucide-react'
import {
  InventoryItem,
  StockTransactionInputSchema,
  type StockTransactionInput,
} from './types'

interface StockManagementFormProps {
  items?: InventoryItem[]
  onSubmit: (data: StockTransactionInput) => Promise<void>
}

export function StockManagementForm({ items = [], onSubmit }: StockManagementFormProps) {
  const { toast } = useToast()
  const form = useForm<StockTransactionInput>({
    resolver: zodResolver(StockTransactionInputSchema),
    defaultValues: {
      itemId: '',
      quantity: 0,
      notes: '',
    },
  })

  const handleSubmit = async (data: StockTransactionInput) => {
    try {
      await onSubmit(data)
      toast({
        title: "Éxito",
        description: "El stock se ha actualizado correctamente.",
        variant: "success",
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock.",
        variant: "destructive",
      })
    }
  }

  const selectedItem = items.find(item => item.id === form.watch('itemId'))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6"
        >
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Seleccionar Producto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(items) && items.length > 0 ? (
                      items.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id}
                          className="flex items-center gap-2 py-3"
                        >
                          <Package2 className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-sm text-muted-foreground">
                              Stock actual: {item.currentStock}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No hay productos disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-lg bg-muted/50"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stock Actual:</span>
                  <span className="ml-2 font-medium">{selectedItem.currentStock}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stock Mínimo:</span>
                  <span className="ml-2 font-medium">{selectedItem.minimumStock}</span>
                </div>
              </div>
            </motion.div>
          )}

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Cantidad</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => field.onChange(Number(field.value) - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="text-center h-12"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => field.onChange(Number(field.value) + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Notas</FormLabel>
                <FormControl>
                  <Input {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpiar
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}