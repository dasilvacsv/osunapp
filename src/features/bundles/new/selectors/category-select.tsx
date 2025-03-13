"use client"

import { useState, useCallback } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddCategoryDialog } from "../AddCategoryDialog"
import { getBundleCategories } from "../actions"

export interface Category {
  id: string
  name: string
  description?: string | null
  status: "ACTIVE" | "INACTIVE" | null
  createdAt: Date | null
  updatedAt: Date | null
}

interface CategorySelectProps {
  initialCategories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string, category: Category) => void
  className?: string
}

export function CategorySelect({
  initialCategories,
  selectedCategoryId,
  onCategorySelect,
  className
}: CategorySelectProps) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBundleCategories()
      if (result.success && result.data) {
        setCategories(result.data)
        
        // If a new category was added, it's likely the last one in the list
        if (result.data.length > 0 && result.data.length > categories.length) {
          const newCategory = result.data[result.data.length - 1]
          onCategorySelect(newCategory.id, newCategory)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch categories",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories"
      })
    } finally {
      setLoading(false)
    }
  }, [categories.length, onCategorySelect, toast])

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    const selectedCategory = categories.find(cat => cat.id === value)
    if (selectedCategory) {
      onCategorySelect(value, selectedCategory)
    }
  }

  // Handle category added
  const handleCategoryAdded = async () => {
    // Refresh categories to get the newly added one
    await refreshCategories()
    
    // Close the dialog
    setShowAddDialog(false)
    
    toast({
      title: "Success",
      description: "Category created successfully",
      duration: 3000,
    })
  }

  return (
    <>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent 
          className="sm:max-w-[500px]" 
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <AddCategoryDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onCategoryAdded={handleCategoryAdded}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={categories.map(cat => ({
                label: cat.name,
                value: cat.id
              }))}
              value={selectedCategoryId}
              onValueChange={handleCategoryChange}
              placeholder={loading ? "Loading categories..." : "Select a category"}
              disabled={loading}
              emptyMessage="No categories found"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
} 