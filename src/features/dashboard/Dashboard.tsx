"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { BadgeDelta } from "./badge-delta"
import { 
  MoreHorizontal, 
  Package, 
  Building2, 
  Users2, 
  UserRound, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Filter
} from 'lucide-react'

interface DashboardProps {
  data: {
    totalRevenue: number
    totalOrganizations: number
    totalClients: number
    totalChildren: number
    recentPurchases: Array<{
      id: string
      totalAmount: number
      status: string
      purchaseDate: string
      clientName: string
      organizationName: string
      paymentStatus: string
      itemCount: number
    }>
    topSellingItems: Array<{
      itemId: string
      itemName: string
      totalQuantity: number
      totalRevenue: number
      averagePrice: number
      currentStock: number
    }>
    organizationStats: Array<{
      organizationId: string
      organizationName: string
      type: string
      totalPurchases: number
      totalRevenue: number
      activeClients: number
    }>
    revenueOverTime: Array<{
      date: string
      revenue: number
    }>
    paymentStats: {
      totalPaid: number
      totalPending: number
      paymentMethods: Array<{
        method: string
        count: number
      }>
    }
    inventoryAlerts: Array<{
      id: string
      name: string
      currentStock: number
      minimumStock: number
      expectedRestock: string | null
    }>
    salesTrends: {
      daily: Array<{
        date: string
        revenue: number
      }>
      monthly: Array<{
        month: string
        revenue: number
      }>
    }
  }
}

export function DashboardComponent({ data }: DashboardProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))
  }

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return { value: 0, trend: "up" }
    const percentageChange = ((current - previous) / previous) * 100
    return {
      value: Math.abs(percentageChange).toFixed(1),
      trend: percentageChange >= 0 ? "up" : "down"
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-500">Resumen de ventas y gestión de organizaciones</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Últimos 30 días
            </Button>
            <Button variant="default" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <BadgeDelta 
                  trend="up" 
                  value={20} 
                  metric="mes anterior" 
                />
                <p className="text-sm text-gray-500">vs. {formatCurrency(data.paymentStats.totalPending)} pendiente</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Organizaciones</p>
                  <p className="text-2xl font-bold">{data.totalOrganizations}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {data.organizationStats.filter(org => org.type === 'SCHOOL').length} Escuelas
                </p>
                <p className="text-sm text-gray-500">
                  {data.organizationStats.filter(org => org.type === 'COMPANY').length} Empresas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Clientes</p>
                  <p className="text-2xl font-bold">{data.totalClients}</p>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <Users2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-1 bg-green-500 rounded-full" 
                    style={{ 
                      width: `${(data.paymentStats.totalPaid / (data.paymentStats.totalPaid + data.paymentStats.totalPending)) * 100}%` 
                    }} 
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round((data.paymentStats.totalPaid / (data.paymentStats.totalPaid + data.paymentStats.totalPending)) * 100)}% clientes al día
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Niños</p>
                  <p className="text-2xl font-bold">{data.totalChildren}</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <UserRound className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={32}>
                  <LineChart data={data.salesTrends.daily.slice(-7)}>
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#9333EA" 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-500 mt-2">Tendencia últimos 7 días</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Ventas Recientes</CardTitle>
                <Button variant="ghost" size="sm">
                  Ver todas
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {data.recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{purchase.clientName}</p>
                        <p className="text-sm text-gray-500">{purchase.organizationName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(purchase.purchaseDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(purchase.totalAmount)}</p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {purchase.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.paymentStatus === 'PAID' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {purchase.paymentStatus === 'PAID' ? 'Pagado' : 'Por pagar'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Productos Más Vendidos</CardTitle>
                <Button variant="ghost" size="sm">
                  Ver detalles
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topSellingItems}>
                  <XAxis dataKey="itemName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar 
                    dataKey="totalRevenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold">Distribución de Organizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.organizationStats}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="totalRevenue"
                      nameKey="organizationName"
                    >
                      {data.organizationStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold">Rendimiento de Organizaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.organizationStats.map((org) => (
                    <TableRow key={org.organizationId} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          {org.organizationName}
                          <p className="text-sm text-gray-500">{org.activeClients} clientes activos</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.type === 'SCHOOL' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {org.type === 'SCHOOL' ? 'Escuela' : 'Empresa'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{formatCurrency(org.totalRevenue)}</p>
                          <p className="text-sm text-gray-500">{org.totalPurchases} compras</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {data.inventoryAlerts.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg font-semibold text-yellow-900">
                  Alertas de Inventario ({data.inventoryAlerts.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventoryAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <div className="mt-1">
                        <div className="w-48 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-yellow-500 rounded-full" 
                            style={{ 
                              width: `${(alert.currentStock / alert.minimumStock) * 100}%` 
                            }} 
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Stock actual: {alert.currentStock} / Mínimo: {alert.minimumStock}
                        </p>
                        {alert.expectedRestock && (
                          <p className="text-xs text-gray-400">
                            Reposición esperada: {new Date(alert.expectedRestock).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Gestionar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DashboardComponent