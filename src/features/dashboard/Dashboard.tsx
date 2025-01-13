"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { BadgeDelta } from "./badge-delta"
import { MoreHorizontal, ArrowRight, Package, Building2, Users2, UserRound, DollarSign } from 'lucide-react'

interface DashboardProps {
  data: {
    totalRevenue: string
    totalOrganizations: number
    totalClients: number
    totalChildren: number
    recentPurchases: Array<{
      id: string
      totalAmount: string
      status: string
      purchaseDate: string
      clientName: string
      organizationName: string
    }>
    topSellingItems: Array<{
      itemId: string
      itemName: string
      totalQuantity: number
      totalRevenue: number
    }>
    organizationStats: Array<{
      organizationId: string
      organizationName: string
      type: string
      totalPurchases: number
      totalRevenue: string | null
    }>
    revenueOverTime: Array<{
      date: string
      revenue: number
    }>
  }
}

export function DashboardComponent({ data }: DashboardProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))
  }


  const calculateChange = (current: number, previous: number) => {
    const percentageChange = ((current - previous) / previous) * 100
    return {
      value: Math.abs(percentageChange).toFixed(0),
      trend: percentageChange >= 0 ? "up" : "down"
    }
  }

  const pieData = [
    { name: "Escuelas", value: data.organizationStats.filter(org => org.type === "SCHOOL").length },
    { name: "Empresas", value: data.organizationStats.filter(org => org.type === "COMPANY").length }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <p className="text-sm text-muted-foreground">Resumen de ventas y gestión de organizaciones</p>
        </div>
        <Button variant="outline" size="sm">
          Enero 2024 - Mayo 2024
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Ingresos</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
              <BadgeDelta trend="up" className="mt-1">20% respecto al mes anterior</BadgeDelta>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Organizaciones</p>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{data.totalOrganizations}</p>
              <p className="text-sm text-muted-foreground mt-1">Cuentas activas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Clientes</p>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{data.totalClients}</p>
              <p className="text-sm text-muted-foreground mt-1">Total registrados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Niños</p>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{data.totalChildren}</p>
              <p className="text-sm text-muted-foreground mt-1">Niños registrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transacciones Recientes</CardTitle>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {data.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{purchase.clientName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(purchase.purchaseDate).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      purchase.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    )}>
                      {purchase.status === "COMPLETED" ? "Completado" : "Pendiente"}
                    </span>
                    <span className="ml-3 text-sm font-medium">{formatCurrency(purchase.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topSellingItems}>
                <XAxis dataKey="itemName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Distribución de Organizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[250px] w-[250px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">{data.totalOrganizations}</span>
                  <p className="text-xs text-muted-foreground">Total de Organizaciones</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Rendimiento de Organizaciones</CardTitle>
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
                  <TableRow key={org.organizationId}>
                    <TableCell className="font-medium">{org.organizationName}</TableCell>
                    <TableCell>{org.type === "SCHOOL" ? "Escuela" : "Empresa"}</TableCell>
                    <TableCell className="text-right">
                      {org.totalRevenue ? formatCurrency(org.totalRevenue) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardComponent