'use client'

import { DataTable } from '@/features/sales/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import NewSaleDialog from '@/features/sales/new=sale-dialog'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesPageContent({ initialSales }: { initialSales: any[] }) {
  const [sales, setSales] = useState(initialSales)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  const refreshSales = useCallback(async () => {
    const response = await fetch('/sales', { cache: 'no-store' })
    const data = await response.json()
    setSales(data)
  }, [])

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registro de Ventas</h1>
        <Button onClick={() => setShowDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        searchKey="client.name"
      />

      <NewSaleDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={(newSale) => {
          setSales(prev => [newSale, ...prev])
          router.refresh()
        }}
      />
    </div>
  )
}