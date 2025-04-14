import { db } from "@/db" // Asegúrate de importar tu instancia de DB

// Validar si un documento ya existe en la base de datos
export async function checkDocumentExists(document: string): Promise<boolean> {
  const existingClient = await db.query.clients.findFirst({
    where: (clients, { eq }) => eq(clients.document, document)
  })
  return !!existingClient
}

// Validar formato de cédula venezolana (ejemplo básico)
export function validateVenezuelanId(id: string): boolean {
  return /^[VE]-\d{6,8}$/i.test(id)
}

// Validar número de teléfono
export function validatePhoneNumber(phone: string): boolean {
  return /^\+?\d{10,14}$/.test(phone)
}