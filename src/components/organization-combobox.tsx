import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

interface Organization {
  id: string
  name: string
}

interface OrganizationComboboxProps {
  organizations: Organization[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function OrganizationCombobox({
  organizations,
  value,
  onValueChange,
  placeholder = "Seleccionar organización..."
}: OrganizationComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? organizations.find((org) => org.id === value)?.name ?? "Sin organización"
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar organización..." />
          <CommandEmpty>No se encontraron organizaciones.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value="organization-none"
              onSelect={() => {
                onValueChange("organization-none")
                setOpen(false)
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === "organization-none" ? "opacity-100" : "opacity-0"
                )}
              />
              Sin organización
            </CommandItem>
            {organizations.map((org) => (
              <CommandItem
                key={org.id}
                value={org.name}
                onSelect={() => {
                  onValueChange(org.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === org.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {org.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}