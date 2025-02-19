import SalesPageContent from './sales-content'
import { getSalesData } from '@/features/sales/actions'

export default async function SalesPage() {
  const salesData = await getSalesData()
  return <SalesPageContent initialSales={salesData.success ? salesData.data : []} />
}