'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package2 } from "lucide-react";
import Link from "next/link";

export type PackageRow = {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  totalSales: number;
  totalRevenue: string;
  beneficiariesCount: number;
  status: string;
};

export const columns: ColumnDef<PackageRow>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Package2 className="w-4 h-4 text-muted-foreground" />
        <Link 
          href={`/packages/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "basePrice",
    header: "Precio Base",
    cell: ({ row }) => (
      <div className="font-medium">
        ${Number(row.getValue("basePrice")).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "totalSales",
    header: "Ventas",
    cell: ({ row }) => row.getValue("totalSales"),
  },
  {
    accessorKey: "totalRevenue",
    header: "Ingresos",
    cell: ({ row }) => `$${row.getValue("totalRevenue")}`,
  },
  {
    accessorKey: "beneficiariesCount",
    header: "Beneficiarios",
    cell: ({ row }) => row.getValue("beneficiariesCount"),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "ACTIVE" ? "default" : "secondary"}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link href={`/packages/${row.original.id}`}>
          <Button variant="ghost" size="icon">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    ),
  },
];