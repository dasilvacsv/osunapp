import { getPackagesWithStats } from "@/features/packages/actions";
import { columns } from "@/features/packages/columns";
import { DataTable } from "@/features/packages/data-table";
import { Package2 } from "lucide-react";

export default async function PackagesPage() {
  const result = await getPackagesWithStats();

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error al cargar los paquetes</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Package2 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Gestión de Paquetes</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={result.data} 
      />
    </div>
  );
}