"use client"

import { SessionProvider, useSession } from "next-auth/react"
import SalesPageContent from "@/features/sales/views/sales-content"
import { useEffect } from "react"

// Define the tab type to match the one in SalesPageContent
type TabType = "sales" | "drafts" | "donations" | "payments" | "reports"

// Debug component to check session
function SessionDebug() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
  }, [session, status])

  return null
}

export default function SalesClientWrapper({
  initialSales,
  viewType = "sales",
}: {
  initialSales: any[]
  viewType?: TabType
}) {
  return (
    <SessionProvider>
      <SessionDebug />
      <SalesPageContent initialSales={initialSales} viewType={viewType} />
    </SessionProvider>
  )
}

