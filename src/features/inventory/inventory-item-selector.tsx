// components/inventory-item-selector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { searchInventory } from './actions'

export function InventoryItemSelector({ onSelect }: { onSelect: (item: any) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const search = setTimeout(async () => {
      if (query.length > 2) {
        setIsSearching(true)
        const result = await searchInventory(query)
        if (result.success) setResults(result.data)
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(search)
  }, [query])

  return (
    <div className="relative">
      <Input
        placeholder="Buscar productos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {query.length > 2 && (
        <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10">
          {isSearching ? (
            <div className="p-2 text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            results.map(item => (
              <div
                key={item.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onSelect(item)
                  setQuery('')
                  setResults([])
                }}
              >
                <div className="flex justify-between">
                  <span>{item.name}</span>
                  <span>Stock: {item.currentStock}</span>
                </div>
                <div className="text-sm text-gray-500">{item.sku}</div>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm">No se encontraron productos</div>
          )}
        </div>
      )}
    </div>
  )
}