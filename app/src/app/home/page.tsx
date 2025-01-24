'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { DropdownMenuLabel, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Home, Sparkles, NotepadText, Volleyball, Ellipsis } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useSessionContext } from '@/components/sessionprovider'

export default function page() {

  const { userData, loading, error }:any = useSessionContext;

  console.log(userData);
  
  const items = [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
    {
      title: "Quiz Generator",
      url: "/home/quiz",
      icon: Sparkles,
    },
    {
      title: "Youtube Summary",
      url: "/home/youtube",
      icon: Home,
    },
    {
      title: "Notes",
      url: "/home/notes",
      icon: NotepadText,
    },
    {
      title: "Summary",
      url: "/home/summary",
      icon: Volleyball,
    },
  ]

  return (
    <>
    <div className='w-full flex flex-1 bg-white flex-col h-full'>
      <div className='h-full text-black hidden sm:w-1/3 sm:flex md:w-1/4 md:flex lg:w-1/5 lg:flex border-r flex-col justify-between'>
      <div className='p-4 flex gap-4 flex-col'>
        {items.map((item:any, index:number) => (
          <Link key={index} href={item.url} className='flex gap-4'>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        ))}
        </div>

        <div className='flex justify-between py-7 px-4 items-center'>
          <DropdownMenu>
            <div>
              <p>{}</p>
            </div>
            <DropdownMenuTrigger className='border leading-none items-center p-1 rounded-lg'><Ellipsis /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
      </div>

      <div className='flex flex-1 w-8/10'>

      </div>
    </div>
    </>
  )
}
