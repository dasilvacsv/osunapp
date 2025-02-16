"use client"

import { useState } from "react"
import { BundleForm } from "./bundle-form"
import type { BundleCategory, InventoryItem } from "./types"
import { createBundle } from "./actions"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddCategoryDialog } from "./AddCategoryDialog"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { FolderPlus, Package, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface BundleManagerProps {
  categories: BundleCategory[]
  items: InventoryItem[]
}

export function BundleManager({ categories, items }: BundleManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleCreateBundle = async (data: any) => {
    try {
      const result = await createBundle(data)
      if (result.success) {
        toast({
          title: "Success",
          description: "Bundle created successfully",
          duration: 3000,
        })
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: `Failed to create bundle: ${result.error}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error creating bundle:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleCategoryAdded = () => {
    toast({
      title: "Success",
      description: "Category created successfully",
      duration: 3000,
    })
    window.location.reload()
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className={cn(
          "text-2xl font-semibold flex items-center gap-2",
          "text-foreground"
        )}>
          <Package className="w-6 h-6 text-primary" />
          Create New Bundle
        </h2>
        <Button
          onClick={() => setIsAddCategoryDialogOpen(true)}
          className={cn(
            "flex items-center gap-2",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          <FolderPlus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="w-full max-w-md">
        <label className={cn(
          "block text-sm font-medium mb-2",
          "text-foreground"
        )}>
          Select Category
        </label>
        <Select
          value={selectedCategory || ""}
          onValueChange={(value) => setSelectedCategory(value)}
        >
          <SelectTrigger className={cn(
            "w-full",
            "bg-background",
            "border-input",
            "ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className={cn(
            "bg-popover",
            "border-border",
            "text-popover-foreground"
          )}>
            <AnimatePresence>
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <SelectItem
                    value={category.id}
                    className={cn(
                      "flex items-center gap-2",
                      "focus:bg-accent focus:text-accent-foreground",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <FolderPlus className="w-4 h-4 text-muted-foreground" />
                    {category.name}
                  </SelectItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "border rounded-lg p-6",
              "bg-card text-card-foreground",
              "border-border",
              "shadow-sm"
            )}
          >
            <BundleForm
              categoryId={selectedCategory}
              items={items}
              onSubmit={handleCreateBundle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onCategoryAdded={handleCategoryAdded}
      />
    </motion.div>
  )
}