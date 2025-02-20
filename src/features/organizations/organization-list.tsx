'use client'

import React, { useCallback, useState, useTransition } from "react"
import { PlusIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationForm } from "./organization-form"
import { OrganizationTable } from "./organization-table"
import { motion, AnimatePresence } from "framer-motion"
import { OrganizationFormData, createOrganization, deleteOrganization, updateOrganization } from "@/app/(app)/organizations/organization"

interface OrganizationListProps {
  initialOrganizations: any[]
}

export default function OrganizationList({ initialOrganizations }: OrganizationListProps) {
  console.log(initialOrganizations);
  
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

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
        <h1 className="text-3xl font-bold tracking-tight">
          Organizaciones
        </h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear Organización
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showCreateDialog && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  Crear Nueva Organización
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
      />
    </motion.div>
  )
}