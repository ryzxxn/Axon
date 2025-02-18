'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import { useSessionContext } from '@/components/sessionprovider'
import dynamic from 'next/dynamic'

export default function page() {

    const {userData} = useSessionContext()

  const {id}:any = useParams()

  const TipTap = dynamic(() => import('@/components/TapEditor'), { ssr: false });
  
    return (
    <>
    {userData &&
    (
        <div className='text-white w-full lg:px-[14rem] md:px-[4rem]'>
          {/* <NoteEditor user_id={userData.id} note_id={id}/> */}
          <TipTap user_id={userData.id} note_id={id}/>
        </div> 
    )}
    </>
  )
}
