"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { BadgeCheck, Building2, Users, UserRound, DollarSign, ShoppingCart } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
    // New data for charts
    revenueOverTime: Array<{
      date: string
      revenue: number
    }>
    purchasesByOrganization: Array<{
      organizationName: string
      purchases: number
    }>
  }
}

export function Component({ data }: DashboardProps) {
  // Transform data for charts
  const revenueOverTime = data.recentPurchases.map(purchase => ({
    date: purchase.purchaseDate,
    revenue: Number(purchase.totalAmount)
  }));

  const purchasesByOrganization = data.organizationStats.map(org => ({
    organizationName: org.organizationName,
    purchases: org.totalPurchases
  }));

  const chartData = {
    ...data,
    revenueOverTime,
    purchasesByOrganization
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrganizations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <UserRound className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalChildren}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.revenueOverTime}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Purchases */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.clientName}</TableCell>
                      <TableCell>{purchase.organizationName}</TableCell>
                      <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                      <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Selling Items Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantity: {
                  label: "Quantity",
                  color: "hsl(var(--chart-2))",
                },
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.topSellingItems}>
                  <XAxis dataKey="itemName" />
                  <YAxis yAxisId="left" orientation="left" stroke="var(--color-quantity)" />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-revenue)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="left" dataKey="totalQuantity" fill="var(--color-quantity)" />
                  <Bar yAxisId="right" dataKey="totalRevenue" fill="var(--color-revenue)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Purchases by Organization Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Purchases by Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              purchases: {
                label: "Purchases",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.purchasesByOrganization} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="organizationName" type="category" width={150} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="purchases" fill="var(--color-purchases)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Organization Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.organizationStats.map((org) => (
                <TableRow key={org.organizationId}>
                  <TableCell className="font-medium">{org.organizationName}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell>{org.totalPurchases}</TableCell>
                  <TableCell>
                    {org.totalRevenue ? formatCurrency(org.totalRevenue) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Component

