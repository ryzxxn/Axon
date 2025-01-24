import Navbar from '@/components/navbar';
import { SessionProvider } from '@/components/sessionprovider';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarGroup, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
