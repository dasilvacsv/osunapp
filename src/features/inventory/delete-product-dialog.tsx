"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteInventoryItem } from "./actions"
import { Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem } from "./types"

interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductDeleted: () => void
  product: InventoryItem | null
}

export function DeleteProductDialog({ open, onOpenChange, onProductDeleted, product }: DeleteProductDialogProps) {
  const [authCode, setAuthCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!product) return

    setLoading(true)

    try {
      const result = await deleteInventoryItem(product.id, authCode)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Producto eliminado exitosamente",
          duration: 3000,
        })
        onProductDeleted()
        onOpenChange(false)
        setAuthCode("")
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Eliminar Producto
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si el producto tiene transacciones asociadas, se desactivará en lugar de
            eliminarse.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-800 mb-4">
            <p className="font-medium text-red-700 dark:text-red-300">
              ¿Estás seguro de que deseas eliminar el producto "{product.name}"?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authCode" className="text-sm font-medium">
              Código de autorización (1234)
            </Label>
            <Input
              id="authCode"
              type="password"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Ingresa el código de autorización"
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !authCode}
            className="relative"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar Producto
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
