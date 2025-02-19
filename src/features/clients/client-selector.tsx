// components/client-selector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { searchClients } from '@/app/(app)/clientes/client'

export function ClientSelector({ onSelect }: { onSelect: (client: any) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const search = setTimeout(async () => {
      if (query.length > 2) {
        setIsSearching(true)
        const result = await searchClients(query)
        if (result.success) setResults(result.data)
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(search)
  }, [query])

  return (
    <div className="relative">
      <Input
        placeholder="Buscar cliente..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {query.length > 2 && (
        <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10">
          {isSearching ? (
            <div className="p-2 text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            results.map(client => (
              <div
                key={client.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onSelect(client)
                  setQuery('')
                  setResults([])
                }}
              >
                {client.name}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm">No se encontraron clientes</div>
          )}
        </div>
      )}
    </div>
  )
}