'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/certificados/export');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al exportar');
      }

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(data.message || 'Archivo exportado correctamente');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar los certificados');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2"
      onClick={handleExport}
      disabled={isLoading}
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'Exportando...' : 'Exportar'}
    </Button>
  );
} 