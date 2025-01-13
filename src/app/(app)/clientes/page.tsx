

import { getClients } from "./client"
import ClientComponent from "./comp"


export default async function Page() {
    const data = await getClients()

    return (
        <div>
    
    <ClientComponent data={data}/>
        </div>
      )
    
}
