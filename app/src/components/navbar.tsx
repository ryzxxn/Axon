import { Sidebar, SidebarProvider, SidebarTrigger } from "./ui/sidebar"

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background flex justify-between"
      style={{ height: "var(--navbar-height, 4rem)" }}
    >
      <div className="flex h-full items-center px-4">
        <p className="italic font-bold text-2xl">AXON</p>
      </div>
      
      <div className="flex h-full items-center px-4">
        <SidebarProvider>
          <SidebarTrigger/>
        </SidebarProvider>
      </div>
    </nav>
  )
}

