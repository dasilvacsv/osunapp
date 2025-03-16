import { notFound } from "next/navigation"
import { SaleDetails } from "./sale-details"
import { getPurchaseById } from "@/features/sales/views/actions"

interface SalePageProps {
  params: {
    id: string
  }
}

export default async function SalePage({ params }: SalePageProps) {
  const { id } = params

  // Fetch sale data
  const result = await getPurchaseById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <SaleDetails sale={result.data} />
}

