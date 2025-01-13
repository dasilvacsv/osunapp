'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Client } from "@/lib/types"
import { ClientForm } from './create-client-form'

interface EditClientDialogProps {
  client: Client
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <ClientForm
          closeDialog={() => onOpenChange(false)}
          mode="edit"
          initialData={client}
        />
      </DialogContent>
    </Dialog>
  )
}