import Navbar from '@/components/navbar';
import { SessionProvider } from '@/components/sessionprovider';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Sidebar, SidebarGroup, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <div className='bg-white flex flex-col w-full h-screen flex-1'>
      <SessionProvider>
        <main className='flex flex-1 flex-col'>
          <Navbar/>
          {children}
        </main>
        </SessionProvider>
    </div>
    </>
  );
}
