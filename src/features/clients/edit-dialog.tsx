// components/edit-dialog.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Client } from "@/lib/types"
import { ClientForm } from "./create-client-form"

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: any) => void
}

export function EditClientDialog({ 
  client, 
  open, 
  onOpenChange,
  onUpdate 
}: EditClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <ClientForm
          initialData={client}
          mode="edit"
          closeDialog={() => onOpenChange(false)}
          onSubmit={onUpdate}
        />
      </DialogContent>
    </Dialog>
  )
}