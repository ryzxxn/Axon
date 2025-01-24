
import { Home, Settings,PhoneIncoming, ChartLine, ReceiptText, Logs, BrainCircuit, SquareUserRound } from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Navbar from "../navbar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
]

export function AppSidebar() {
  return (
    <>
      <div className="flex p-0 text-2xl flex-col">
        {/* <p className="uppercase text-[#000000] font-bold">axon</p> */}
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild className="text-black">
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </div>
    </>
  )
}