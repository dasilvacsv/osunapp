"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { InventoryItem } from "@/lib/types" // assuming this type exists

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "basePrice",
    header: "Base Price",
    cell: ({ row }) => formatCurrency(parseFloat(row.getValue("basePrice"))),
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
  },
  {
    accessorKey: "reservedStock",
    header: "Reserved",
  },
  {
    accessorKey: "minimumStock",
    header: "Min Stock",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "ACTIVE" ? "default" : "secondary"}>
        {row.getValue("status")}
      </Badge>
    ),
  },
] 