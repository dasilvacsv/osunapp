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
        <h1 className="text-3xl font-bold">Bundles Test Page</h1>
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
      
      <div className="mt-8 p-4 border rounded-md bg-muted/50">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="overflow-auto p-4 bg-muted rounded-md text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
} 