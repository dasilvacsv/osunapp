"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPurchaseDetails } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, ChevronDown, ChevronRight, ShoppingBag, Package, Image } from "lucide-react"
import type { Purchase } from "../types"

interface PurchasesTableProps {
  purchases: Purchase[]
}

export function PurchasesTable({ purchases }: PurchasesTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, any>>({})
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fetchPurchaseDetails = async (purchaseId: string) => {
    if (purchaseDetails[purchaseId]) return

    try {
      setDetailsLoading((prev) => ({ ...prev, [purchaseId]: true }))
      const result = await getPurchaseDetails(purchaseId)
      if (result.success && result.data) {
        setPurchaseDetails((prev) => ({ ...prev, [purchaseId]: result.data }))
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la compra",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los detalles de la compra",
        variant: "destructive",
      })
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [purchaseId]: false }))
    }
  }

  const toggleExpand = (purchaseId: string) => {
    const newExpanded = { ...expanded, [purchaseId]: !expanded[purchaseId] }
    setExpanded(newExpanded)

    if (newExpanded[purchaseId] && !purchaseDetails[purchaseId]) {
      fetchPurchaseDetails(purchaseId)
    }
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No hay compras registradas</h3>
          <p className="text-muted-foreground">Registra tu primera compra usando la pestaña "Registrar Compra".</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Factura</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {purchases.map((purchase) => (
              <>
                <motion.tr
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="relative group hover:bg-muted/50"
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(purchase.id)}
                      className="transition-transform group-hover:scale-110"
                    >
                      {expanded[purchase.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                  <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                  <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(purchase.totalAmount))}
                  </TableCell>
                </motion.tr>
                {expanded[purchase.id] && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell colSpan={5}>
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="p-4 bg-muted/30 rounded-lg"
                      >
                        {detailsLoading[purchase.id] ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : purchaseDetails[purchase.id] ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Productos</h4>
                              <div className="bg-background rounded-md border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Producto</TableHead>
                                      <TableHead className="text-right">Cantidad</TableHead>
                                      <TableHead className="text-right">Costo</TableHead>
                                      <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {purchaseDetails[purchase.id].items.map((item: any, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                          {item.item.name}
                                        </TableCell>
                                        <TableCell className="text-right">{item.purchaseItem.quantity}</TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(Number(item.purchaseItem.unitCost))}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {formatCurrency(Number(item.purchaseItem.totalCost))}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {/* Mostrar adjuntos si existen */}
                            {purchase.metadata &&
                              purchase.metadata.attachments &&
                              purchase.metadata.attachments.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    Documentos adjuntos
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {purchase.metadata.attachments.map((attachment: string, index: number) => (
                                      <div key={index} className="border rounded-md p-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm truncate">
                                          {attachment.split("-").slice(2).join("-")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {purchase.notes && (
                              <div className="p-3 bg-background rounded-md border">
                                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Notas
                                </h4>
                                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-4">
                            <p className="text-muted-foreground">No se pudieron cargar los detalles</p>
                          </div>
                        )}
                      </motion.div>
                    </TableCell>
                  </motion.tr>
                )}
              </>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
}

