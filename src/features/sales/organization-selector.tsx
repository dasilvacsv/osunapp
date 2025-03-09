"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getOrganizations } from "@/app/(app)/organizations/organization"
import { Building2 } from "lucide-react"

interface OrganizationSelectorProps {
  onOrganizationSelect: (organizationId: string | null) => void
  selectedOrganizationId?: string | null
}

export function OrganizationSelector({ onOrganizationSelect, selectedOrganizationId }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true)
      try {
        const result = await getOrganizations()
        if (result.data) {
          setOrganizations(result.data)
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor="organization" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Organización (opcional)
      </Label>
      <Select
        value={selectedOrganizationId || ""}
        onValueChange={(value) => onOrganizationSelect(value || null)}
        disabled={loading}
      >
        <SelectTrigger id="organization">
          <SelectValue placeholder="Seleccionar organización" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Ninguna</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Asociar la venta a una organización permite generar reportes específicos.
      </p>
    </div>
  )
}

