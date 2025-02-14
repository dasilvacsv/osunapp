'use client'

export function InventoryLogger({ data }: { data: any }) {
  console.log(data)

  return (
    <div>
      <h1>Inventory Data Logged to Console</h1>
    </div>
  )
} 