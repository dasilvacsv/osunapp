
import { getSalesData2 } from '@/features/sales/views/actions'
import SalesPageContent from '@/features/sales/views/sales-content'
import { TestComponent } from '@/features/inventory/view/comp'

export default async function SalesPage() {
  const salesData = await getSalesData2()
  
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