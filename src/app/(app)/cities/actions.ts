"use server"

import { db } from "@/db"
import { cities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type CityFormData = {
  name: string
  state?: string
  country: string
}

export async function getCities() {
  try {
    const data = await db.select().from(cities).where(eq(cities.status, "ACTIVE"))
    return { data }
  } catch (error) {
    console.error("Error fetching cities:", error)
    return { error: "Failed to fetch cities" }
  }
}

export async function createCity(data: CityFormData) {
  try {
    const newCity = await db
      .insert(cities)
      .values({
        name: data.name,
        state: data.state,
        country: data.country,
        status: "ACTIVE",
      })
      .returning()

    revalidatePath("/cities")
    return { success: "City created successfully", data: newCity[0] }
  } catch (error) {
    console.error("Error creating city:", error)
    return { error: "Failed to create city" }
  }
}

export async function updateCity(id: string, data: CityFormData) {
  try {
    const updatedCity = await db
      .update(cities)
      .set({
        name: data.name,
        state: data.state,
        country: data.country,
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))
      .returning()

    revalidatePath("/cities")
    return { success: "City updated successfully", data: updatedCity[0] }
  } catch (error) {
    console.error("Error updating city:", error)
    return { error: "Failed to update city" }
  }
}

export async function deleteCity(id: string) {
  try {
    await db
      .update(cities)
      .set({
        status: "INACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))

    revalidatePath("/cities")
    return { success: "City deleted successfully" }
  } catch (error) {
    console.error("Error deleting city:", error)
    return { error: "Failed to delete city" }
  }
}

