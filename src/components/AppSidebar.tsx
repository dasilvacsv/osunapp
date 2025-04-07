import React from "react"
import { auth } from "@/features/auth"
import { redirect } from "next/navigation"
import { MainSidebar } from "./MainSidebar"

type NavItem = {
  title: string;
  url: string;
  icon: "LayoutDashboard" | "School" | "Users" | "Package" | "Receipt" | "Building" | "Package2";
  items?: { title: string; url: string; }[];
}

const allNavItems: NavItem[] = [
  {
    title: "Panel Principal",
    url: "/",
    icon: "LayoutDashboard"
  },
  {
    title: "Organizaciones",
    url: "/organizations",
    icon: "School"
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: "Users",
    items: [
      {
        title: "Lista de Clientes",
        url: "/clientes",
      },
      {
        title: "Clientes por Organización",
        url: "/clientes/byOrg",
      }
    ],
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: "Package",
    items: [
      {
        title: "Lista de Inventario",
        url: "/inventario",
      },
      {
        title: "Gestión de Inventario",
        url: "/inventario/stock",
      }
    ],
  },
  {
    title: "Ventas",
    url: "/sales",
    icon: "Receipt"
  },
  {
    title: "Ciudades",
    url: "/cities",
    icon: "Building"
  },
  {
    title: "Resumen de Paquetes",
    url: "/certificados",
    icon: "Package2",
    items: [
      {
        title: "Resumen de Paquetes",
        url: "/certificados",
      }
    ],
  },
];

export async function AppSidebar() {
  const session = await auth();
  

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Filter items based on role
  let filteredItems = [...allNavItems];
  
  if (session.user.role === "OPERATOR") {
    filteredItems = allNavItems.filter(item => 
      item.title === "Organizaciones" || 
      item.title === "Clientes" ||
      item.title === "Panel Principal"
    );
  }

  const userInfo = {
    name: session.user.name || "",
    email: session.user.email || "",
    role: session.user.role || ""
  };

  return <MainSidebar items={filteredItems} user={userInfo} />;
} 