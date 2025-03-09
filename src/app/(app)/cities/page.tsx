import { getCities } from "./actions"
import CityManagement from "@/features/cities/city-management"

export const dynamic = "force-dynamic"

export default async function CitiesPage() {
  const { data: cities } = await getCities()

  return (
    <div className="container mx-auto px-4 py-6">
      <CityManagement initialCities={cities || []} />
    </div>
  )
}

