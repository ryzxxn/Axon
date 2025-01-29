"use client"
import { Navbar } from "@/components/navbar"
import { SessionProvider } from '@/components/sessionprovider';
import Lenis from "lenis";


export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  

  // Initialize Lenis
const lenis = new Lenis({
  autoRaf: true,
});

// Listen for the scroll event and log the event data
lenis.on('scroll', (e) => {
  console.log(e);
});

  return (
    <>
    <SessionProvider>
      <div className="flex flex-col bg-white flex-1 max-h-screen">
        <Navbar />

        <div className="flex flex-col flex-1 bg-white h-full">
          {children}
        </div>
      </div>
    </SessionProvider>
    </>
  )
}

