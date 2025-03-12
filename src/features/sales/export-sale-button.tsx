"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import { ExportSaleDialog } from "./export-sale-dialog"

interface ExportSaleButtonProps {
  saleId: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  title?: string
}

export function ExportSaleButton({
  saleId,
  variant = "outline",
  size = "default",
  className = "",
  title = "Exportar a Excel",
}: ExportSaleButtonProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setShowExportDialog(true)} className={`gap-2 ${className}`}>
        {size === "icon" ? (
          <FileSpreadsheet className="h-4 w-4" />
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" />
            {title}
          </>
        )}
      </Button>

      <ExportSaleDialog open={showExportDialog} onOpenChange={setShowExportDialog} saleId={saleId} />
    </>
  )
}

