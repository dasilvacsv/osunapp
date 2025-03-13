"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
          const hasSubItems = item.items && item.items.length > 0
          // Get the first subroute URL if it exists
          const firstSubItemUrl = hasSubItems && item.items && item.items.length > 0 ? item.items[0].url : item.url

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref legacyBehavior>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className={isActive ? "bg-accent text-accent-foreground" : ""}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <div className="group-data-[collapsible=icon]:w-full">
                    <div className="group-data-[collapsible=icon]:hidden">
                      <SidebarMenuButton 
                        tooltip={item.title}
                        className={isActive ? "bg-accent" : ""}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </div>
                    <div className="hidden group-data-[collapsible=icon]:block">
                      <Link href={firstSubItemUrl} passHref legacyBehavior>
                        <SidebarMenuButton 
                          tooltip={item.title}
                          className={isActive ? "bg-accent" : ""}
                        >
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={isSubItemActive ? "bg-accent" : ""}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
