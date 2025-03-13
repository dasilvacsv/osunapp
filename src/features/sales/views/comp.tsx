// app/(dashboard)/events/components/EventsTable.tsx
"use client"


interface EventsTableProps {
  data: any
}


export function TestComponent({ data }: EventsTableProps) {
    console.log(data);
    
  return (
    <div>
    test
    
    </div>
  )
}