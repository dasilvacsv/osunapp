import { getPurchaseDetails } from '@/features/sales/actions'
import { SaleDetails } from './sale-details'

export default async function SaleDetailPage({
  params
}: {
  params: { id: string }
}) {
  const result = await getPurchaseDetails(params.id)
  
  if (!result.success || !result.data) {
    return <div className="p-6 text-red-500">Venta no encontrada</div>
  }

  return <SaleDetails sale={result.data} />
}