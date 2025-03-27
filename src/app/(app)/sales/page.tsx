import { getSalesData2 } from "@/features/sales/views/actions"
import SalesPageContent from "@/features/sales/views/sales-content"

export default async function SalesPage() {
  const salesData = await getSalesData2()

  // Add error handling for the sales data
  if (!salesData.success) {
    console.error("Error fetching sales data:", salesData.error)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Ventas</h1>
      <SalesPageContent initialSales={salesData.success ? salesData.data : []} />
    </div>
  )
}

