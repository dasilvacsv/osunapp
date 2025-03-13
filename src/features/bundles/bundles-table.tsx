"use client"

import { useState, useMemo, useEffect } from "react";
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
import { 
  MoreHorizontal, 
  Package, 
  School, 
  Building2, 
  Users, 
  Tag, 
  Eye, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Building,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
  status: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items: BundleItem[];
  totalBasePrice: number;
  totalBundlePrice: number;
  savings: number;
  savingsPercentage: number;
}

interface OrganizationGroup {
  id: string | null;
  name: string | null;
  type: string | null;
  bundles: Bundle[];
  totalBundles: number;
  totalItems: number;
}

interface BundlesTableProps {
  bundles: Bundle[];
}

export function BundlesTable({ bundles }: BundlesTableProps) {
  const router = useRouter();
  const [expandedBundles, setExpandedBundles] = useState<Record<string, boolean>>({});
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  // Group bundles by organization
  const organizationGroups = useMemo(() => {
    // Create a special group for bundles without an organization
    const noOrgGroup: OrganizationGroup = {
      id: null,
      name: "Paquetes Generales",
      type: null,
      bundles: [],
      totalBundles: 0,
      totalItems: 0
    };

    // Group bundles by organization
    const groups: Record<string, OrganizationGroup> = {};
    
    bundles.forEach(bundle => {
      if (!bundle.organizationId) {
        noOrgGroup.bundles.push(bundle);
        noOrgGroup.totalBundles++;
        noOrgGroup.totalItems += bundle.items.length;
        return;
      }
      
      const orgId = bundle.organizationId;
      if (!groups[orgId]) {
        groups[orgId] = {
          id: orgId,
          name: bundle.organizationName,
          type: bundle.organizationType,
          bundles: [],
          totalBundles: 0,
          totalItems: 0
        };
      }
      
      groups[orgId].bundles.push(bundle);
      groups[orgId].totalBundles++;
      groups[orgId].totalItems += bundle.items.length;
    });
    
    // Convert to array and sort by organization name
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    
    // Add the "No Organization" group at the end if it has bundles
    if (noOrgGroup.bundles.length > 0) {
      sortedGroups.push(noOrgGroup);
    }
    
    return sortedGroups;
  }, [bundles]);

  // Initialize expanded state for organizations
  useEffect(() => {
    const initialExpandedOrgs: Record<string, boolean> = {};
    organizationGroups.forEach(group => {
      // Expand the first organization by default
      initialExpandedOrgs[group.id || 'no-org'] = organizationGroups.length === 1;
    });
    setExpandedOrgs(initialExpandedOrgs);
  }, [organizationGroups]);

  const toggleBundleExpansion = (bundleId: string) => {
    setExpandedBundles(prev => ({
      ...prev,
      [bundleId]: !prev[bundleId]
    }));
  };

  const toggleOrgExpansion = (orgId: string | null) => {
    const key = orgId || 'no-org';
    setExpandedOrgs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getOrganizationIcon = (type: string | null) => {
    if (!type) return <Globe className="h-5 w-5" />;
    
    switch (type) {
      case "SCHOOL":
        return <School className="h-5 w-5" />;
      case "COMPANY":
        return <Building2 className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {organizationGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No bundles found.
          </CardContent>
        </Card>
      ) : (
        organizationGroups.map(group => (
          <Card key={group.id || 'no-org'} className="overflow-hidden">
            <button
              onClick={() => toggleOrgExpansion(group.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getOrganizationIcon(group.type)}
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.totalBundles} bundle{group.totalBundles !== 1 ? 's' : ''} with {group.totalItems} item{group.totalItems !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {group.totalBundles} bundle{group.totalBundles !== 1 ? 's' : ''}
                </Badge>
                {expandedOrgs[group.id || 'no-org'] ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
            
            {expandedOrgs[group.id || 'no-org'] && (
              <CardContent className="p-0">
                <div className="rounded-md border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Base Price</TableHead>
                        <TableHead className="text-right">Bundle Price</TableHead>
                        <TableHead className="text-right">Savings</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.bundles.map(bundle => (
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBundleExpansion(bundle.id);
                                }}
                                className="flex items-center gap-1"
                              >
                                {bundle.items.length} item{bundle.items.length !== 1 ? 's' : ''}
                                {expandedBundles[bundle.id] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
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
                              <TableCell colSpan={7} className="p-0">
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
                                      {bundle.items.map(item => (
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
} 