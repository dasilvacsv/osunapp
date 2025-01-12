'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2, Users, School, Camera } from 'lucide-react';

// Mock Data
const initialClients = [
  { 
    id: 1, 
    name: 'John Doe',
    email: 'john@example.com',
    children: [
      { id: 1, name: 'Sarah Doe', school: 'Springfield Elementary', grade: '3rd' },
      { id: 2, name: 'Mike Doe', school: 'Springfield Elementary', grade: '5th' }
    ]
  },
  // Add more mock clients...
];

const initialBundles = [
  {
    id: 1,
    name: 'Premium School Package',
    price: 299.99,
    components: [
      { type: 'photo', quantity: 5, description: 'Digital Prints' },
      { type: 'medal', quantity: 1, description: 'Gold Medal' },
      { type: 'certificate', quantity: 1, description: 'Achievement Certificate' }
    ]
  },
  // Add more mock bundles...
];

const initialPurchases = [
  {
    id: 1,
    clientId: 1,
    childId: 1,
    bundleId: 1,
    status: 'completed',
    totalAmount: 299.99,
    date: '2025-01-10'
  },
  // Add more mock purchases...
];

const Dashboard = () => {
  // State Management
  const [clients, setClients] = useState(initialClients);
  const [bundles, setBundles] = useState(initialBundles);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  // Business Logic Functions
  const addNewClient = (clientData) => {
    setClients(prev => [...prev, { id: prev.length + 1, ...clientData }]);
  };

  const addChildToClient = (clientId, childData) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          children: [...client.children, { id: client.children.length + 1, ...childData }]
        };
      }
      return client;
    }));
  };

  const createPurchase = (clientId, childId, bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    const newPurchase = {
      id: purchases.length + 1,
      clientId,
      childId,
      bundleId,
      status: 'pending',
      totalAmount: bundle.price,
      date: new Date().toISOString().split('T')[0]
    };
    setPurchases(prev => [...prev, newPurchase]);
  };

  // Statistics for Dashboard
  const getStats = () => ({
    totalClients: clients.length,
    totalPurchases: purchases.length,
    recentPurchases: purchases.slice(-5),
    totalRevenue: purchases.reduce((acc, curr) => acc + curr.totalAmount, 0)
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStats().totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getStats().totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bundles</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bundles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStats().recentPurchases.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getStats().recentPurchases.map(purchase => {
                const client = clients.find(c => c.id === purchase.clientId);
                const bundle = bundles.find(b => b.id === purchase.bundleId);
                return (
                  <div key={purchase.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <p className="font-medium">{client?.name}</p>
                      <p className="text-sm text-muted-foreground">{bundle?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${purchase.totalAmount}</p>
                      <p className="text-sm text-muted-foreground">{purchase.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Bundles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bundles.map(bundle => (
                <div key={bundle.id} className="p-4 border rounded">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{bundle.name}</h3>
                    <span className="font-medium">${bundle.price}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Components: {bundle.components.map(c => c.description).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;