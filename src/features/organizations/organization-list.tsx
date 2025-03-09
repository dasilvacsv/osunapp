'use client'

import React, { useCallback, useState, useTransition, useEffect } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { OrganizationTable } from "./organization-table"
import { OrganizationMetrics } from "./organization-metrics"
import { motion, AnimatePresence } from "framer-motion"
import { OrganizationFormData, createOrganization, deleteOrganization, updateOrganization } from "@/app/(app)/organizations/organization"
import { getOrganizationMetrics } from "./organization-actions"

interface OrganizationListProps {
  initialOrganizations: any[]
}

export default function OrganizationList({ initialOrganizations }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedOrganization, setSelectedOrganization] = useState(organizations[0])
  const [metrics, setMetrics] = useState<any>(null)

  const loadMetrics = useCallback(async (orgId: string) => {
    const result = await getOrganizationMetrics(orgId)
    if (result.success) {
      setMetrics(result.data)
    }
  }, [])

  useEffect(() => {
    if (selectedOrganization) {
      loadMetrics(selectedOrganization.id)
    }
  }, [selectedOrganization, loadMetrics])

  const refreshOrganizations = useCallback((newOrganizations: any[]) => {
    setOrganizations(newOrganizations)
  }, [])

  const handleCreateOrganization = useCallback(async (data: OrganizationFormData) => {
    startTransition(async () => {
      const result = await createOrganization(data)
      if (result.success && result.data) {
        setShowCreateDialog(false)
        setOrganizations(prev => [...prev, result.data])
      } else {
        console.error(result.error)
      }
    })
  }, [])
  
  const handleUpdateOrganization = useCallback(async (id: string, data: OrganizationFormData) => {
    startTransition(async () => {
      const result = await updateOrganization(id, data)
      if (result.success && result.data) {
        setOrganizations(prev => 
          prev.map(org => 
            org.id === id ? { ...org, ...result.data } : org
          )
        )
      } else {
        console.error(result.error)
      }
    })
  }, [])

  const handleDeleteOrganization = useCallback(async (id: string) => {
    startTransition(async () => {
      const result = await deleteOrganization(id)
      if (result.success) {
        refreshOrganizations(organizations.filter(org => org.id !== id))
      } else {
        console.error(result.error)
      }
    })
  }, [organizations, refreshOrganizations])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card text-card-foreground p-6 rounded-xl shadow-md dark:border dark:border-gray-700">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Organizations
          </h1>
          <p className="text-muted-foreground">
            Manage your organizations and view their performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Organization Selector */}
      {organizations.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant={selectedOrganization?.id === org.id ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedOrganization(org)}
            >
              {org.name}
            </Button>
          ))}
        </div>
      )}

      {/* Metrics Dashboard */}
      {selectedOrganization && metrics && (
        <OrganizationMetrics
          organization={selectedOrganization}
          metrics={metrics}
        />
      )}

      <AnimatePresence>
        {showCreateDialog && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  Create New Organization
                </DialogTitle>
              </DialogHeader>
              <OrganizationForm 
                closeDialog={() => setShowCreateDialog(false)}
                mode="create"
                onSubmit={handleCreateOrganization}
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <OrganizationTable
        organizations={organizations}
        isLoading={isPending}
        onUpdateOrganization={handleUpdateOrganization}
        onDeleteOrganization={handleDeleteOrganization}
        selectedOrganizations={selectedOrganizations}
        setSelectedOrganizations={setSelectedOrganizations}
        onSelectOrganization={setSelectedOrganization}
        selectedOrganization={selectedOrganization}
      />
    </motion.div>
  )
}