"use client"

import { useState } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { ClientSheet } from "./client-sheet"

interface EventSelectProps {
  options: { label: string; value: string }[]
  onValueChange: (value: string) => void
  value?: string
  placeholder?: string
  className?: string
  showAddClient?: boolean
  onClientAdded?: (client: { id: number; name: string }) => void
  disabled?: boolean
}

export function EventSelect({
  options,
  onValueChange,
  value,
  placeholder,
  className,
  showAddClient,
  onClientAdded,
  disabled
}: EventSelectProps) {
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false)

  return (
    <>
      <PopoverSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        onAddItem={showAddClient ? () => setIsClientSheetOpen(true) : undefined}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        showAddItemDialog={false}
      />
      
      {showAddClient && (
        <ClientSheet
          isOpen={isClientSheetOpen}
          onClose={() => setIsClientSheetOpen(false)}
          onSuccess={(client) => {
            onClientAdded?.(client)
            setIsClientSheetOpen(false)
          }}
        />
      )}
    </>
  )
} 