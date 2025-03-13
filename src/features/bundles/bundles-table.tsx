"use client"

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Package, School, Building2, Users, Tag, Eye, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BundleItem {
  itemId: string;
  itemName: string;
  basePrice: number;
  quantity: number;
  overridePrice: number | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationType: string | null;
  basePrice: string | null;
  bundlePrice: string | null;
  discountPercentage: string | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  items: BundleItem[];
  totalBasePrice: number;
  totalBundlePrice: number;
  savings: number;
  savingsPercentage: number;
}

interface BundlesTableProps {
  bundles: Bundle[];
}

export function BundlesTable({ bundles }: BundlesTableProps) {
  const router = useRouter();
  const [expandedBundles, setExpandedBundles] = useState<Record<string, boolean>>({});

  const toggleBundleExpansion = (bundleId: string) => {
    setExpandedBundles((prev) => ({
      ...prev,
      [bundleId]: !prev[bundleId],
    }));
  };

  const getOrganizationIcon = (type: string | null) => {
    if (!type) return <Users className="h-4 w-4" />;
    
    switch (type) {
      case "SCHOOL":
        return <School className="h-4 w-4" />;
      case "COMPANY":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Bundles</CardTitle>
        <CardDescription>
          Manage your product bundles and packages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-right">Bundle Price</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No bundles found.
                  </TableCell>
                </TableRow>
              ) : (
                bundles.map((bundle) => (
                  <>
                    <TableRow key={bundle.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{bundle.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {bundle.categoryName ? (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {bundle.categoryName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bundle.organizationName ? (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            {getOrganizationIcon(bundle.organizationType)}
                            {bundle.organizationName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No organization</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bundle.totalBasePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bundle.totalBundlePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 dark:text-green-400">
                            {formatCurrency(bundle.savings)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({bundle.savingsPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBundleExpansion(bundle.id)}
                        >
                          {bundle.items.length} items
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/bundles/${bundle.id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/bundles/${bundle.id}/edit`)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" /> Edit bundle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Delete bundle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedBundles[bundle.id] && (
                      <TableRow key={`${bundle.id}-items`} className="bg-muted/50">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Bundle Items</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item Name</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Base Price</TableHead>
                                  <TableHead className="text-right">Override Price</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bundle.items.map((item) => (
                                  <TableRow key={item.itemId}>
                                    <TableCell>{item.itemName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(item.basePrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {item.overridePrice !== null ? (
                                        formatCurrency(item.overridePrice)
                                      ) : (
                                        <span className="text-muted-foreground text-sm">Default</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(
                                        (item.overridePrice !== null ? item.overridePrice : item.basePrice) * item.quantity
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 