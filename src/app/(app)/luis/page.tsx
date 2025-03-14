import { InteractiveTable } from "@/components/interactive-table"

export default function Home() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Interactive Table with Edit Dialog</h1>
      <InteractiveTable />
    </div>
  )
}

