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

const ICONS = {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  School,
  Building,
  Package2
};

interface NavItem {
  title: string;
  url: string;
  icon: keyof typeof ICONS;
  items?: { title: string; url: string; }[];
}

interface MainSidebarProps extends React.ComponentProps<typeof Sidebar> {
  items: NavItem[];
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function MainSidebar({ items, user, ...props }: MainSidebarProps) {
  // Transform items to include actual icon components
  const navItems = React.useMemo(() => {
    return items.map(item => ({
      ...item,
      icon: ICONS[item.icon]
    }));
  }, [items]);

  const userInfo = React.useMemo(() => ({
    name: user.name || "Loading...",
    email: user.email || "",
    avatar: "", // Default empty avatar
  }), [user]);

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
        <NavUser user={userInfo} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
} 