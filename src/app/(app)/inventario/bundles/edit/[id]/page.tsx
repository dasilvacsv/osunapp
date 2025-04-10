import { getBundleById, getBundleCategories, getOrganizations } from "@/features/inventory/bundles/actions"
import { BundleEditor } from "@/features/inventory/bundles/bundle-editor"
import { redirect } from "next/navigation"

interface BundleEditPageProps {
  params: {
    id: string
  }
}

export default async function BundleEditPage({ params }: BundleEditPageProps) {
  const bundleId = params.id

  // Verificar si el paquete existe
  const bundleResult = await getBundleById(bundleId)
  if (!bundleResult.success) {
    redirect("/inventario/bundles")
  }

  // Obtener categorías y organizaciones
  const categoriesResult = await getBundleCategories()
  const organizationsResult = await getOrganizations()

  const categories = categoriesResult.success ? categoriesResult.data : []
  const organizations = organizationsResult.success ? organizationsResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Paquete</h1>
      <BundleEditor bundleId={bundleId} categories={categories} organizations={organizations} />
    </div>
  )
}
