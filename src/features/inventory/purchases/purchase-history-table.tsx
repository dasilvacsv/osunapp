"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPurchases } from "../stock/actions"
import { useToast } from "@/hooks/use-toast"
import { Eye, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Purchase } from "../types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PurchaseHistoryTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  // Cargar compras
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true)
        const result = await getPurchases()
        if (result.success && result.data) {
          setPurchases(result.data)
          setFilteredPurchases(result.data)
        } else {
          toast({
            title: "Error",
            description: "No se pudieron cargar las compras",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching purchases:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar las compras",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [toast])

  // Filtrar compras
  useEffect(() => {
    let result = [...purchases]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (purchase) =>
          purchase.supplierName.toLowerCase().includes(term) ||
          (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(term)),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      result = result.filter((purchase) => purchase.status === statusFilter)
    }

    setFilteredPurchases(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, purchases])

  // Calcular páginas
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const currentItems = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No hay compras registradas</h3>
        <p className="text-muted-foreground">Aún no se han registrado compras en el sistema.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por proveedor o factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="PAID">Pagado</SelectItem>
              <SelectItem value="PARTIAL">Pago Parcial</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((purchase) => {
                const totalAmount = Number(purchase.totalAmount)
                const paidAmount = Number(purchase.paidAmount || 0)
                const pendingAmount = totalAmount - paidAmount

                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                    <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                    <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          purchase.status === "PAID"
                            ? "default"
                            : purchase.status === "PARTIAL"
                              ? "outline"
                              : "secondary"
                        }
                        className={
                          purchase.status === "PARTIAL"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : purchase.status === "PENDING"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : ""
                        }
                      >
                        {purchase.status === "PAID"
                          ? "Pagado"
                          : purchase.status === "PARTIAL"
                            ? "Pago Parcial"
                            : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(paidAmount)}</TableCell>
                    <TableCell className="text-right">
                      {pendingAmount > 0 ? (
                        <span className="text-destructive">{formatCurrency(pendingAmount)}</span>
                      ) : (
                        formatCurrency(0)
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inventario/compras/${purchase.id}`} prefetch={false}>
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} de {filteredPurchases.length} compras
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

