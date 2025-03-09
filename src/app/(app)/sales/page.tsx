import SalesPageContent from './sales-content'
import { getSalesData } from '@/features/sales/actions'

export default async function SalesPage() {
  const salesData = await getSalesData()
  
  // Add error handling for the sales data
  if (!salesData.success) {
    console.error('Error fetching sales data:', salesData.error)
  }
  
  return (
    <div className="container mx-auto">
      <SalesPageContent initialSales={salesData.success ? salesData.data : []} />
    </div>
  )
}