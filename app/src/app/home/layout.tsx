import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider, useSessionContext } from '@/components/sessionprovider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
    <SessionProvider>
      <Navbar />
        <div style={{ "--navbar-height": "4rem" } as React.CSSProperties}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="pt-[var(--navbar-height,4rem)]">
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </SessionProvider>
    </>
  )
}

