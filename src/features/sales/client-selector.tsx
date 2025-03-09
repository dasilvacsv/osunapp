import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { User, Search, Plus, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchClients, createClient } from "@/app/(app)/clientes/client"

interface ClientSelectorProps {
  onClientSelect: (client: any) => void
  selectedClient?: any
  onCreateClient?: () => void
}

interface NewClientFormData {
  name: string
  document?: string
  phone?: string
  email?: string
}

export function ClientSelector({ onClientSelect, selectedClient, onCreateClient }: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // New client form state
  const [newClient, setNewClient] = useState<NewClientFormData>({
    name: "",
    document: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const fetchClients = async () => {
      if (search.length < 2) {
        setClients([])
        return
      }

      setLoading(true)
      try {
        const result = await searchClients(search)
        if (result.success) {
          setClients(result.data || [])
        } else {
          setClients([])
        }
      } catch (error) {
        console.error("Error searching clients:", error)
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    const handler = setTimeout(fetchClients, 300)
    return () => clearTimeout(handler)
  }, [search])

  const handleSelectClient = (client: any) => {
    onClientSelect(client)
    setSearch("")
    setClients([])
    setOpen(false)
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingClient(true)

    try {
      const result = await createClient({
        name: newClient.name,
        document: newClient.document,
        phone: newClient.phone,
        contactInfo: {
          email: newClient.email || "",
          phone: newClient.phone,
        },
        role: "INDIVIDUAL",
      })

      if (result.success) {
        handleSelectClient(result.data)
        setShowNewClientForm(false)
        setNewClient({
          name: "",
          document: "",
          phone: "",
          email: "",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error creating client:", error)
      // Here you might want to show an error message to the user
    } finally {
      setCreatingClient(false)
    }
  }

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClientSelect(null)
    setSearch("")
    setClients([])
  }

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !selectedClient && "text-muted-foreground"
        )}
        onClick={() => setOpen(true)}
      >
        <User className="mr-2 h-4 w-4" />
        {selectedClient ? (
          <div className="flex items-center justify-between w-full">
            <span>{selectedClient.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-2 hover:bg-transparent"
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          "Seleccionar cliente"
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {showNewClientForm ? "Crear Nuevo Cliente" : "Seleccionar Cliente"}
            </DialogTitle>
          </DialogHeader>

          {showNewClientForm ? (
            <form onSubmit={handleCreateClient} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Documento</Label>
                <Input
                  id="document"
                  value={newClient.document}
                  onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                  placeholder="Número de documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creatingClient}>
                  {creatingClient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Cliente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientSearch">Buscar cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    ref={inputRef}
                    id="clientSearch"
                    type="text"
                    placeholder="Nombre o documento..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {loading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Buscando...
                  </div>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="w-full p-3 hover:bg-muted rounded-md cursor-pointer text-left border transition-colors"
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.document || "Sin documento"}
                      </div>
                    </button>
                  ))
                ) : search.length > 1 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No se encontraron resultados
                  </div>
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Ingresa al menos 2 caracteres para buscar
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowNewClientForm(true)}
              >
                <Plus className="h-4 w-4" />
                Crear nuevo cliente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}