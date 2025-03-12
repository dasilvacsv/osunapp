import ViewClient from "@/features/clients/view-client"

export const dynamic = "force-dynamic"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Detalle del Cliente</h1>
      <ViewClient clientId={params.id} />
    </div>
  )
} 