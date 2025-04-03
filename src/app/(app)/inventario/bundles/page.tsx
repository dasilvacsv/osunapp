import { BundleCreator } from "@/features/inventory/bundles/bundle-creator"
import { getBundleCategories, getOrganizations } from "@/features/inventory/bundles/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, List } from "lucide-react"
import { BundlesList } from "@/features/inventory/bundles/bundles-list"

export const dynamic = "force-dynamic"

export default async function BundlesPage() {
  // Obtener datos en paralelo
  const [categoriesResult, organizationsResult] = await Promise.all([
    getBundleCategories(),
    getOrganizations()
  ])

  const categories = categoriesResult.success ? categoriesResult.data : []
  const organizations = organizationsResult.success ? organizationsResult.data : []

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Bundles</h1>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Bundles Existentes
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Crear Nuevo Bundle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Bundles Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BundlesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <BundleCreator 
            categories={categories} 
            organizations={organizations}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}