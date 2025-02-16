import { getBundleCategories, getInventoryItems, createBundleCategory, createBundle } from "@/features/inventory/actions"
import { BundleCategoryForm } from "@/features/inventory/bundle-category-form"
import { BundleForm } from "@/features/inventory/bundle-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateBundleCategoryInput, CreateBundleInput } from "@/features/inventory/types"

export default async function BundlesPage() {
  const { data: categories } = await getBundleCategories()
  const { data: items } = await getInventoryItems()
  
  async function handleCreateCategory(data: CreateBundleCategoryInput) {
    'use server'
    return createBundleCategory(data)
  }

  async function handleCreateBundle(data: CreateBundleInput) {
    'use server'
    return createBundle(data)
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="create-bundle">Create Bundle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <BundleCategoryForm onSubmit={handleCreateCategory} />
              
              <div className="mt-8">
                {categories?.map(category => (
                  <div key={category.id} className="p-4 border rounded-lg mb-4">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create-bundle">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bundle</CardTitle>
            </CardHeader>
            <CardContent>
              {categories && items && (
                <BundleForm 
                  categoryId={categories[0]?.id} 
                  items={items}
                  onSubmit={handleCreateBundle}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 