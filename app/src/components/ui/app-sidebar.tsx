"use client"

import { Brain, Home, Youtube, FileText, PieChart, Dices } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/home",
  },
  {
    title: "Quiz Generator",
    icon: Dices,
    url: "/home/quiz",
  },
  {
    title: "Youtube Summary",
    icon: Youtube,
    url: "/home/youtube",
  },
  {
    title: "Notes",
    icon: FileText,
    url: "#",
  },
  {
    title: "Summary",
    icon: PieChart,
    url: "#",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="top-[var(--navbar-height,4rem)]" {...props}>
      <SidebarContent className="bg-white">
        <SidebarMenu className="p-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon className="size-8" />
                  <p className="text-[1rem]">{item.title}</p>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

