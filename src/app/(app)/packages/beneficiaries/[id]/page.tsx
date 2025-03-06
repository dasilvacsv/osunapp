import { getBeneficiaryDetails } from "@/features/packages/actions";
import { Button } from "@/components/ui/button";
import { Package2, User, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function BeneficiaryDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const result = await getBeneficiaryDetails(params.id);

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <div className="text-red-500">Beneficiario no encontrado</div>
      </div>
    );
  }

  const { beneficiary, bundle, purchase } = result.data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6" />
          Detalles del Beneficiario
        </h1>
        <Link href={`/packages/${bundle.id}`}>
          <Button variant="outline">
            <Package2 className="w-4 h-4 mr-2" />
            Ver Paquete
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información Personal</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Nombre completo:</span>{" "}
              {beneficiary.firstName} {beneficiary.lastName}
            </p>
            <p>
              <span className="font-medium">Colegio:</span> {beneficiary.school}
            </p>
            <p>
              <span className="font-medium">Nivel:</span> {beneficiary.level}
            </p>
            <p>
              <span className="font-medium">Sección:</span> {beneficiary.section}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Detalles del Paquete</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Paquete:</span> {bundle.name}
            </p>
            <p>
              <span className="font-medium">Precio base:</span> ${bundle.basePrice}
            </p>
            {purchase && (
              <>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Fecha de compra:</span>{" "}
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">Monto pagado:</span>{" "}
                  ${purchase.totalAmount}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}