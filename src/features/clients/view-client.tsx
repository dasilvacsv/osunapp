// app/components/view-client-dialog.tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientDetails } from "./client-details"
import { Client } from "@/lib/types"

interface ViewClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewClientDialog({ client, open, onOpenChange }: ViewClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>
        <ClientDetails clientId={client.id} />
      </DialogContent>
    </Dialog>
  )
}