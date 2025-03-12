"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CityForm } from "./city-form"
import { CityTable } from "./city-table"
import { type CityFormData, createCity, updateCity, deleteCity } from "@/features/cities/actions"

interface City {
  id: string
  name: string
  state?: string
  country: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

interface CityManagementProps {
  initialCities: City[]
}

export default function CityManagement({ initialCities }: CityManagementProps) {
  const [cities, setCities] = useState<City[]>(initialCities)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateCity = async (data: CityFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createCity(data)
      if (result.success && result.data) {
        setCities((prev) => [
          ...prev,
          {
            ...result.data,
            createdAt: result.data.createdAt ? result.data.createdAt.toISOString() : "",
            updatedAt: result.data.updatedAt ? result.data.updatedAt.toISOString() : "",
          } as City,
        ])
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error("Error creating city:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCity = async (id: string, data: CityFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateCity(id, data)
      if (result.success && result.data) {
        setCities((prev) => prev.map((city) => 
          city.id === id 
            ? {
                ...result.data,
                createdAt: result.data.createdAt ? result.data.createdAt.toISOString() : "",
                updatedAt: result.data.updatedAt ? result.data.updatedAt.toISOString() : "",
              } as City 
            : city
        ))
      }
    } catch (error) {
      console.error("Error updating city:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCity = async (id: string) => {
    try {
      const result = await deleteCity(id)
      if (result.success) {
        setCities((prev) => prev.filter((city) => city.id !== id))
      }
    } catch (error) {
      console.error("Error deleting city:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-primary" />
            Gestión de Ciudades
          </CardTitle>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Nueva Ciudad
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Administre las ciudades disponibles para las organizaciones.</p>

          <CityTable cities={cities} onUpdateCity={handleUpdateCity} onDeleteCity={handleDeleteCity} />
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Crear Nueva Ciudad</DialogTitle>
          </DialogHeader>
          <CityForm
            closeDialog={() => setShowCreateDialog(false)}
            onSubmit={handleCreateCity}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

