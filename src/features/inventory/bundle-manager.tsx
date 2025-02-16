'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BundleForm } from './bundle-form'
import { BundleCategoryForm } from './bundle-category-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createBundleCategory, createBundle } from './actions'
import { BundleCategory, InventoryItem, CreateBundleCategoryInput, CreateBundleInput } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BundleManagerProps {
  categories: BundleCategory[]
  items: InventoryItem[]
}

export function BundleManager({ categories, items }: BundleManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '')
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)

  const handleCreateCategory = async (data: CreateBundleCategoryInput) => {
    const result = await createBundleCategory(data)
    if (result.success) {
      setShowNewCategoryDialog(false)
      // You might want to refresh the categories list here
    }
  }

  const handleCreateBundle = async (data: CreateBundleInput) => {
    const result = await createBundle(data)
    if (result.success) {
      // Handle success (maybe show a toast notification)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">New Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Bundle Category</DialogTitle>
            </DialogHeader>
            <BundleCategoryForm onSubmit={handleCreateCategory} />
          </DialogContent>
        </Dialog>
      </div>

      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Bundle</CardTitle>
          </CardHeader>
          <CardContent>
            <BundleForm
              categoryId={selectedCategory}
              items={items}
              onSubmit={handleCreateBundle}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 