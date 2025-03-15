"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { X, Upload, File, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  value: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  showPreview?: boolean
  className?: string
}

export function FileUploader({
  value,
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept,
  showPreview = true,
  className,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null)

      // Check if adding these files would exceed the max files limit
      if (value.length + acceptedFiles.length > maxFiles) {
        setError(`No puedes subir más de ${maxFiles} archivos`)
        return
      }

      // Filter out any files that are too large
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSize) {
          setError(`El archivo ${file.name} excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB`)
          return false
        }
        return true
      })

      onChange([...value, ...validFiles])
    },
    [value, onChange, maxFiles, maxSize],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  })

  const removeFile = (index: number) => {
    const newFiles = [...value]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {isDragActive ? "Suelta los archivos aquí" : "Arrastra archivos aquí o haz clic para seleccionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo {maxFiles} archivos, {maxSize / (1024 * 1024)}MB por archivo
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showPreview && value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Archivos seleccionados ({value.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {value.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(file)}
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

