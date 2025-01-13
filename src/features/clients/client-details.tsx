// app/components/ClientDetails.tsx
"use client"

import { DetailedClientResponse, getDetailedClient } from "@/app/(app)/clientes/client";
import { useEffect, useState } from "react";

export function ClientDetails({ clientId }: { clientId: string }) {
  const [clientData, setClientData] = useState<DetailedClientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClientData() {
      const result = await getDetailedClient(clientId);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setClientData(result.data);
      }
    }

    loadClientData();
  }, [clientId]);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!clientData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{clientData.client.name}</h2>
        <p>Document: {clientData.client.document}</p>
        <p>Phone: {clientData.client.phone}</p>
        <p>WhatsApp: {clientData.client.whatsapp}</p>
      </div>

      {clientData.organization && (
        <div>
          <h3 className="text-xl font-semibold">Organization</h3>
          <p>{clientData.organization.name}</p>
        </div>
      )}

      {clientData.children && clientData.children.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold">Children</h3>
          <ul>
            {clientData.children.map(child => (
              <li key={child.id}>
                {child.name} - Grade: {child.grade}, Section: {child.section}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}