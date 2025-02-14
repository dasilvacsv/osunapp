'use client'

import MainSidebar from "@/components/MainSidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <MainSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="font-semibold">Osuna Fotografías</h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-4 px-4">
            <div className="container flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Osuna Fotografías
              </p>
              <ThemeSwitcher />
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

