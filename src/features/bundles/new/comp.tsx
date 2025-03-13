// app/(dashboard)/events/components/EventsTable.tsx
"use client"

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OrganizationSelect, Organization } from "./selectors/organization-select";
import { CategorySelect, Category } from "./selectors/category-select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getBundleCategories, createBundle } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Tag, 
  Trash2, 
  DollarSign,
  Loader2
} from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Define form schema
const formSchema = z.object({
  organizationId: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Please select a category"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
    overridePrice: z.number().optional()
  })).min(1, "At least one item must be added to the bundle"),
  totalBasePrice: z.number(),
  bundlePrice: z.number(),
  savingsPercentage: z.number()
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItem {
  id: string;
  name: string;
  basePrice: number;
  currentStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  allowPreSale?: boolean;
}

interface BundleCreationFormProps {
  organizations: Organization[];
  categories?: Category[];
  items: InventoryItem[];
}

export function BundleCreationForm({ 
  organizations, 
  categories: initialCategories = [],
  items: initialItems = []
}: BundleCreationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bundle form state
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { quantity: number; overridePrice?: number }
  }>({});

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: null,
      categoryId: "",
      name: "",
      description: "",
      items: [],
      totalBasePrice: 0,
      bundlePrice: 0,
      savingsPercentage: 0
    },
  });

  // Calculate totals
  const totalBasePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    const item = initialItems.find((i) => i.id === itemId);
    return acc + (item?.basePrice || 0) * data.quantity;
  }, 0);

  const totalOverridePrice = Object.entries(selectedItems).reduce((acc, [itemId, data]) => {
    const item = initialItems.find((i) => i.id === itemId);
    // Use the override price if specified, otherwise use the item's base price
    const price = data.overridePrice !== undefined ? data.overridePrice : (item?.basePrice || 0);
    return acc + price * data.quantity;
  }, 0);

  const savings = totalBasePrice - totalOverridePrice;
  const savingsPercentage = totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0;

  // Fetch categories if not provided
  useEffect(() => {
    if (initialCategories.length === 0) {
      fetchCategories();
    }
  }, [initialCategories.length]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await getBundleCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSelect = (organizationId: string, organization: Organization) => {
    setSelectedOrganizationId(organizationId);
    // @ts-ignore - We know this is valid based on our schema
    form.setValue("organizationId", organizationId || null);
  };

  const handleCategorySelect = (categoryId: string, category: Category) => {
    setSelectedCategoryId(categoryId);
    form.setValue("categoryId", categoryId);
  };

  const onSubmit = async (formData: FormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare bundle data
      const bundleData = {
        ...formData,
        organizationId: formData.organizationId || null,
        items: Object.entries(selectedItems).map(([itemId, data]) => {
          const item = initialItems.find((i) => i.id === itemId);
          // If the override price is the same as the base price, don't send it
          // This ensures we use the default price in the database
          const overridePrice = data.overridePrice !== item?.basePrice ? data.overridePrice : undefined;
          
          return {
            itemId,
            quantity: data.quantity,
            overridePrice,
          };
        }),
        totalBasePrice,
        bundlePrice: totalOverridePrice,
        savingsPercentage: totalBasePrice > 0 ? (savings / totalBasePrice) * 100 : 0,
      };
      
      console.log("Submitting bundle:", bundleData);
      
      // Create the bundle
      const result = await createBundle(bundleData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Bundle created successfully",
          duration: 3000,
        });
        
        // Redirect to bundles page
        router.push("/bundles");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create bundle",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form values when selected items change
  useEffect(() => {
    form.setValue("totalBasePrice", totalBasePrice);
    form.setValue("bundlePrice", totalOverridePrice);
    form.setValue("savingsPercentage", savingsPercentage);
    
    const items = Object.entries(selectedItems).map(([itemId, data]) => ({
      itemId,
      quantity: data.quantity,
      overridePrice: data.overridePrice
    }));
    
    form.setValue("items", items);
  }, [selectedItems, form, totalBasePrice, totalOverridePrice, savingsPercentage]);
    
  // Item selector component
  const ItemSelector = () => {
    const [open, setOpen] = useState(false);
    const availableItems = initialItems.filter(item => !selectedItems[item.id]);
    
    const handleSelectItem = (item: InventoryItem) => {
      setSelectedItems(prev => ({
        ...prev,
        [item.id]: { 
          quantity: 1,
          overridePrice: item.basePrice
        }
      }));
      setOpen(false);
    };
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 hover:bg-muted/50 transition-colors">
            <Plus className="w-4 h-4" />
            Select an item to add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search items..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>No items found.</p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {availableItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelectItem(item)}
                    className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(item.basePrice)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };
  
  return (
    <div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create New Bundle</CardTitle>
          <CardDescription>Select an organization and category for this bundle</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Organization Selection */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <OrganizationSelect
                        selectedOrganizationId={field.value}
                        onOrganizationSelect={handleOrganizationSelect}
                        initialOrganizations={organizations}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category Selection */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategorySelect
                        selectedCategoryId={field.value}
                        onCategorySelect={handleCategorySelect}
                        initialCategories={categories}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bundle Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Bundle Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="transition-all focus:ring-2 focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bundle Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bundle Items */}
              <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Bundle Items
                </h3>
                
                <ItemSelector />
                
                <AnimatePresence>
                  <div className="space-y-4 mt-6">
                    {Object.keys(selectedItems).map((itemId) => {
                      const item = initialItems.find((i) => i.id === itemId);
                      if (!item) return null;
                      const itemData = selectedItems[item.id];
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative flex items-center gap-4 p-4 border rounded-lg bg-muted group hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Base price: {formatCurrency(item.basePrice)}
                              {itemData.overridePrice === item.basePrice && 
                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">Default</span>
                              }
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-1 rounded-full hover:bg-muted/70 transition-colors"
                                onClick={() => {
                                  const currentQty = itemData?.quantity || 0;
                                  if (currentQty > 1) {
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: currentQty - 1 },
                                    }));
                                  }
                                }}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <Input
                                type="number"
                                className="w-20 text-center"
                                value={itemData?.quantity || ""}
                                onChange={(e) => {
                                  const qty = Number.parseInt(e.target.value);
                                  if (qty > 0) {
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: qty },
                                    }));
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="p-1 rounded-full hover:bg-muted/70 transition-colors"
                                onClick={() => {
                                  const currentQty = itemData?.quantity || 0;
                                  setSelectedItems((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], quantity: currentQty + 1 },
                                  }));
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="w-32"
                                placeholder={`Default: ${formatCurrency(item.basePrice)}`}
                                value={itemData?.overridePrice ?? ""}
                                onChange={(e) => {
                                  const price = Number.parseFloat(e.target.value);
                                  if (e.target.value === "") {
                                    // If the field is cleared, use the item's base price
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], overridePrice: item.basePrice },
                                    }));
                                  } else if (price >= 0) {
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], overridePrice: price },
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setSelectedItems((prev) => {
                                const { [item.id]: _, ...rest } = prev;
                                return rest;
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/70" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
              
              {/* Price Summary */}
              {Object.keys(selectedItems).length > 0 && (
                <div className="bg-muted p-6 rounded-lg border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 bg-card rounded-lg shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Total base price:</p>
                      <p className="font-semibold text-lg text-foreground">
                        {formatCurrency(totalBasePrice)}
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Bundle price:</p>
                      <p className="font-semibold text-lg text-foreground">
                        {formatCurrency(totalOverridePrice)}
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Total savings:</p>
                      <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(savings)}
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Savings percentage:</p>
                      <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                        {savingsPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || Object.keys(selectedItems).length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Bundle...
                  </>
                ) : (
                  "Create Bundle"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}