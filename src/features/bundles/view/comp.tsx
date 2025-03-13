// app/(dashboard)/events/components/EventsTable.tsx
"use client"

import { useState } from "react";
import { AddCategoryDialog } from "../AddCategoryDialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";


interface EventsTableProps {
  data: any
}


export function TestComponent({ data }: EventsTableProps) {
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const { toast } = useToast()

    console.log(data);

    const handleCategoryAdded = () => {
      toast({
        title: "Success",
        description: "Category created successfully",
        duration: 3000,
      })
      window.location.reload()
    }
    
  return (
    <div>
    test

    <Button
          onClick={() => setIsAddCategoryDialogOpen(true)}
          className={cn(
            "flex items-center gap-2",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
        >
          <FolderPlus className="w-4 h-4" /> Add Category
        </Button>

    <AddCategoryDialog
      open={isAddCategoryDialogOpen}
      onOpenChange={setIsAddCategoryDialogOpen}
      onCategoryAdded={handleCategoryAdded}
    />
    
    </div>
  )
}