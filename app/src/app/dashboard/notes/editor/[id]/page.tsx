'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import { useSessionContext } from '@/components/sessionprovider'
import dynamic from 'next/dynamic'
import Tiptap from '@/components/TapEditor'

export default function page() {

    const {userData} = useSessionContext()

  const {id}:any = useParams()

  const NoteEditor = dynamic(() => import('@/components/NoteEditor'), { ssr: false });
  const TipTap = dynamic(() => import('@/components/TapEditor'), { ssr: false });
  
    return (
    <>
    {userData &&
    (
        <div className='text-white w-full'>
          {/* <NoteEditor user_id={userData.id} note_id={id}/> */}
          <Tiptap user_id={userData.id} note_id={id}/>
        </div> 
    )}
    </>
  )
}
