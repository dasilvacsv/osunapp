"use client"

import React from "react"
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  School,
  Building,
  Package2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { NavMain } from "./NavMain"
import { NavUser } from "./NavUser"

const navItems = [
  {
    title: "Panel Principal",
    url: "/",
    icon: LayoutDashboard
  },
  {
    title: "Organizaciones",
    url: "/organizations",
    icon: School
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
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
    icon: Package
  },
  {
    title: "Ventas",
    url: "/sales",
    icon: Receipt
  },
  {
    title: "Ciudades",
    url: "/cities",
    icon: Building
  },
  {
    title: "Paquetes",
    url: "/bundles",
    icon: Package2
  },
];

export default function MainSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = {
    name: "Fotógrafo Admin",
    email: "admin@fotografia.com",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pb-2">
        <div className="relative transition-all duration-200">
          {/* Logo en estado expandido */}
          <div className="flex items-center px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Image
                  src="/logo.png"
                  alt="Logo Estudio Fotográfico"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-sidebar-foreground">Osuna Fotografías</span>
                <span className="text-xs text-sidebar-foreground/70">Sistema de Gestión</span>
              </div>
            </div>
          </div>

          {/* Logo en estado colapsado */}
          <div className="hidden items-center justify-center py-2 group-data-[collapsible=icon]:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Image
                src="/logo.png"
                alt="Logo Estudio Fotográfico"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}