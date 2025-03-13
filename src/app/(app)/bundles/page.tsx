import { getBundles } from "@/features/bundles/new/actions";
import { BundlesTable } from "@/features/bundles/bundles-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function BundlesTestPage() {
  const result = await getBundles();
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bundles Test Page</h1>
          <p className="text-muted-foreground mt-1">
            Bundles grouped by organization with collapsible sections
          </p>
        </div>
        <Link href="/bundles/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Bundle
          </Button>
        </Link>
      </div>
      
      {result.success ? (
        <BundlesTable bundles={result.data || []} />
      ) : (
        <div className="p-8 text-center">
          <p className="text-red-500">{result.error || "Failed to load bundles"}</p>
        </div>
      )}
      
    </div>
  );
} 