import { getBundleDetails } from '@/features/packages/actions';
import { PackageDetails } from './package-details';

export default async function PackageDetailPage({
  params
}: {
  params: { id: string }
}) {
  const result = await getBundleDetails(params.id);
  
  if (!result.success || !result.data) {
    return <div className="p-6 text-red-500">Paquete no encontrado</div>
  }

  return <PackageDetails bundle={result.data} />;
}