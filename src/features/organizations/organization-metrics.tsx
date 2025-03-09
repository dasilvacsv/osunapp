import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Building2, CreditCard, Users, TrendingUp, AlertTriangle, Package, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MetricsProps {
  metrics: {
    monthlySales: Array<{
      month: string;
      sales: number;
      count: number;
    }>;
    pendingPayments: {
      total: number;
      count: number;
    };
    revenue: {
      total: number;
      count: number;
    };
    activeClients: number;
    topItems: Array<{
      itemName: string;
      totalQuantity: number;
      totalRevenue: string;
    }>;
    recentActivity: Array<{
      id: string;
      date: Date;
      amount: number;
      status: string;
      clientName: string;
    }>;
    growthRate: number;
  };
  organization: any;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(new Date(date));

export function OrganizationMetrics({ metrics, organization }: MetricsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">Sales: {formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">
            Orders: {metrics.monthlySales.find(m => m.month === label)?.count || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.revenue.total)}
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-xs",
                metrics.growthRate > 0 ? "text-green-600" : "text-red-600"
              )}>
                {metrics.growthRate > 0 ? "+" : ""}{metrics.growthRate.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertTriangle className={cn(
              "h-4 w-4",
              metrics.pendingPayments.total > 0 ? "text-yellow-500" : "text-green-500"
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.pendingPayments.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingPayments.count} pending orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Total registered clients
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Orders</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.monthlySales[metrics.monthlySales.length - 1]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlySales}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.totalQuantity} units sold
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(Number(item.totalRevenue))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(Number(activity.amount))}
                  </p>
                  <p className={cn(
                    "text-xs",
                    activity.status === "COMPLETED" ? "text-green-600" : 
                    activity.status === "PENDING" ? "text-yellow-600" : 
                    "text-blue-600"
                  )}>
                    {activity.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Basic Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {organization.name}</p>
                <p><span className="text-muted-foreground">Type:</span> {organization.type}</p>
                <p><span className="text-muted-foreground">Nature:</span> {organization.nature}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {organization.contactInfo?.email || '-'}</p>
                <p><span className="text-muted-foreground">Phone:</span> {organization.contactInfo?.phone || '-'}</p>
                <p><span className="text-muted-foreground">Address:</span> {organization.address || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}