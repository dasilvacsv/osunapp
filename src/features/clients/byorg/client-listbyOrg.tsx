'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  UserCheck, 
  GraduationCap,
  Briefcase,
  Plus,
  RefreshCcw
} from "lucide-react"
import type { Organization, OrganizationListData } from "./types"
import { OrganizationsTable } from "./byorg-table"

function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  className 
}: { 
  icon: any, 
  title: string, 
  value: number | string,
  className?: string 
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-full p-3 ${className}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface OrganizationListProps {
  initialData: OrganizationListData
}

export function OrganizationList({ initialData }: OrganizationListProps) {
  console.log(initialData);
  
  const [data, setData] = useState(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Calculate statistics
  const totalOrganizations = data.data.length
  const totalClients = data.data.reduce((acc, org) => acc + org.clients.length, 0)
  const activeClients = data.data.reduce((acc, org) => 
    acc + org.clients.filter(client => client.status === 'ACTIVE').length, 0
  )
  const schoolCount = data.data.filter(org => org.type === 'SCHOOL').length
  const companyCount = data.data.filter(org => org.type === 'COMPANY').length

  const refreshData = async () => {
    setIsRefreshing(true)
    // Add your refresh logic here
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Organization Overview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
              icon={Building2} 
              title="Total Organizations" 
              value={totalOrganizations}
              className="bg-blue-100 text-blue-600"
            />
            <StatCard 
              icon={Users} 
              title="Total Clients" 
              value={totalClients}
              className="bg-green-100 text-green-600"
            />
            <StatCard 
              icon={UserCheck} 
              title="Active Clients" 
              value={activeClients}
              className="bg-emerald-100 text-emerald-600"
            />
            <StatCard 
              icon={GraduationCap} 
              title="Schools" 
              value={schoolCount}
              className="bg-purple-100 text-purple-600"
            />
            <StatCard 
              icon={Briefcase} 
              title="Companies" 
              value={companyCount}
              className="bg-orange-100 text-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      <OrganizationsTable data={data} />
    </div>
  )
}