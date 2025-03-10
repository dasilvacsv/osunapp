import { getBundleDetails } from "@/features/packages/actions"
import { PackageDetails } from "@/features/packages/package-details"
import { notFound } from "next/navigation"

export default async function PackagePage({ params }: { params: { id: string } }) {
  const result = await getBundleDetails(params.id)

  if (!result.success) {
    notFound()
  }

  return <PackageDetails bundle={result.data} />
}

