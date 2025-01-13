"use client"

interface ClientProps {
    data: any
}


export function ClientComponent({ data }: ClientProps) {
    console.log(data);
    
  

  return (
<>
Hello world
</>
  )
}

export default ClientComponent