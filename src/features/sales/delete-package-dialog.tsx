"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { deleteBundle } from "./actions"

interface DeletePackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundleId: string
  bundleName: string
  onSuccess?: () => void
}

export function DeletePackageDialog({ open, onOpenChange, bundleId, bundleName, onSuccess }: DeletePackageDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      const result = await deleteBundle(bundleId)

      if (result.success) {
        toast({
          title: "Paquete eliminado",
          description: `El paquete "${bundleName}" ha sido eliminado correctamente`,
          className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el paquete",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Eliminar Paquete
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el paquete y todos sus datos asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">¿Estás seguro de que deseas eliminar este paquete?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Se eliminará el paquete "{bundleName}" y todos sus datos asociados. Los beneficiarios y ventas
                relacionadas también pueden verse afectados.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {loading ? "Eliminando..." : "Eliminar Paquete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

