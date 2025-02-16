'use client'

import { useState } from 'react'
import { InventoryTable } from './inventory-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InventoryItem } from '@/lib/types'
import { StockTransactionInput } from './types'
import { stockIn, stockOut } from './actions'
import { BundleManager } from './bundle-manager'

interface InventoryManagerProps {
  initialData: InventoryItem[]
  bundleCategories: BundleCategory[]
}

export function InventoryManager({ initialData, bundleCategories }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialData)
  const [activeTab, setActiveTab] = useState('inventory')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const handleStockUpdate = async (input: StockTransactionInput) => {
    const result = input.quantity > 0 
      ? await stockIn(input)
      : await stockOut({ ...input, quantity: Math.abs(input.quantity) })

    if (result.success) {
      // Refresh data
      // TODO: Add refresh logic
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable 
                data={items} 
                onSelect={setSelectedItem}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Add StockManagementForm component */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Management</CardTitle>
            </CardHeader>
            <CardContent>
              <BundleManager 
                categories={bundleCategories}
                items={initialData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 