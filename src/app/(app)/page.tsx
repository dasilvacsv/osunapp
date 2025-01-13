import Component from "@/features/dashboard/Dashboard"
import { getDashboardData } from "@/features/dashboard/fetch"


export default async function Page() {
    const data = await getDashboardData()

    return (
        <div>
    
    <Component data={data}/>
        </div>
      )
    
}
