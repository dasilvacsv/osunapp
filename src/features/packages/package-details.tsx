'use client';

import { BundleWithBeneficiaries } from '@/features/packages/actions';
import { addBundleBeneficiary, removeBundleBeneficiary } from '@/features/packages/actions';
import { useState } from 'react';
import { Package2, UserPlus, X, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PackageDetails({ bundle }: { bundle: BundleWithBeneficiaries }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    school: '',
    level: '',
    section: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addBundleBeneficiary(bundle.id, formData);
    if (result.success) {
      setShowForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        school: '',
        level: '',
        section: ''
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Package2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">{bundle.name}</h1>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Detalles del Paquete</h2>
            <p className="text-gray-600">{bundle.description}</p>
            <p className="mt-2">
              <span className="font-medium">Precio Base:</span> ${bundle.basePrice}
            </p>
            {bundle.discountPercentage && (
              <p className="text-green-600">
                Descuento: {bundle.discountPercentage}%
              </p>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Datos de Ventas</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <span className="font-medium">Total Ventas:</span>{' '}
                {bundle.salesData.totalSales}
              </p>
              <p>
                <span className="font-medium">Ingresos Totales:</span> $
                {parseFloat(bundle.salesData.totalRevenue).toFixed(2)}
              </p>
              {bundle.salesData.lastSaleDate && (
                <p>
                  <span className="font-medium">Última Venta:</span>{' '}
                  {new Date(bundle.salesData.lastSaleDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Beneficiarios</h2>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Agregar Beneficiario
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Colegio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nivel
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sección
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="ghost"
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {bundle.beneficiaries.map((beneficiary) => (
              <div
                key={beneficiary.id}
                className="flex justify-between items-center p-4 bg-white border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {beneficiary.firstName} {beneficiary.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {beneficiary.school} - {beneficiary.level} {beneficiary.section}
                  </p>
                  
                  {/* Detalles de compra */}
                  {beneficiary.purchase?.purchaseDate && (
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        {new Date(beneficiary.purchase.purchaseDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                  {beneficiary.purchase?.totalAmount && (
                    <p className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        ${beneficiary.purchase.totalAmount}
                      </span>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/packages/beneficiaries/${beneficiary.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver detalles
                    </Button>
                  </Link>
                  <button
                    onClick={() => removeBundleBeneficiary(beneficiary.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}