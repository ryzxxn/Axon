"use client"
import { Navbar } from "@/components/navbar"
import { SessionProvider } from '@/components/sessionprovider';

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  

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

