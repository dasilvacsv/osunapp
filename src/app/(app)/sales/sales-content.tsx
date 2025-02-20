'use client'

import { DataTable } from '@/features/sales/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { PlusIcon, RefreshCw } from 'lucide-react'
import NewSaleDialog from '@/features/sales/new-sale-dialog'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SalesPageContent({ initialSales }: { initialSales: any[] }) {
  const [sales, setSales] = useState(initialSales)
  const [showDialog, setShowDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const refreshSales = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/sales', { cache: 'no-store' })
      const data = await response.json()
      setSales(data)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Registro de Ventas
        </motion.h1>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            size="icon"
            onClick={refreshSales}
            className={`transition-all duration-700 ${isRefreshing ? 'rotate-180' : ''}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setShowDialog(true)}
            className="group"
          >
            <PlusIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-125" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DataTable
          columns={columns}
          data={sales}
          searchKey="client.name"
        />
      </motion.div>

      <NewSaleDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={(newSale) => {
          setSales(prev => [newSale, ...prev])
          router.refresh()
        }}
      />
    </motion.div>
  )
}