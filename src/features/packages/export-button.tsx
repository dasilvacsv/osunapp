"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import { ExportDialog } from "./export-dialog"

interface ExportButtonProps {
  beneficiaryId?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  title?: string
}

export function ExportButton({
  beneficiaryId,
  variant = "outline",
  size = "default",
  className = "",
  title = "Exportar a Excel",
}: ExportButtonProps) {
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

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        beneficiaryId={beneficiaryId}
        title={beneficiaryId ? "Exportar Beneficiario" : "Exportar Beneficiarios"}
      />
    </>
  )
}

