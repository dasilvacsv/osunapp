"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { useDebounce } from "use-debounce"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PopoverSelectProps {
  options: { label: string; value: string; data?: any }[]
  placeholder?: string
  emptyMessage?: string
  value?: string
  onValueChange?: (value: string) => void
  onAddItem?: () => void
  className?: string
  disabled?: boolean
  showAddItemDialog?: boolean
  triggerContent?: React.ReactNode
}

export function PopoverSelect({
  options,
  placeholder = "Select an option",
  emptyMessage = "No options found.",
  value,
  onValueChange,
  onAddItem,
  className,
  disabled = false,
  showAddItemDialog = true,
  triggerContent,
}: PopoverSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [width, setWidth] = React.useState<number | undefined>(undefined)

  // Update width when the popover opens
  React.useEffect(() => {
    if (open && buttonRef.current) {
      setWidth(buttonRef.current.offsetWidth)
    }
  }, [open])

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) => option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  }, [options, debouncedSearchTerm])

  const handleAddItemClick = () => {
    if (onAddItem) {
      onAddItem()
    }
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            <div className="flex w-full justify-between items-center">
              <div className="truncate flex-grow text-left">
                {triggerContent ? (
                  triggerContent
                ) : (
                  value ? options.find((option) => option.value === value)?.label : placeholder
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" sideOffset={5} style={{ width: width ? `${width}px` : 'auto' }}>
          <Command className="w-full">
            <CommandInput placeholder="Search options..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {onAddItem && (
                <>
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleAddItemClick}
                      data-value="add-new-item"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add new item
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onValueChange?.(option.value)
                      setOpen(false)
                    }}
                    data-value={option.value}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

