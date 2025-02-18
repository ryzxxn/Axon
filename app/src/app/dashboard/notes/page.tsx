'use client'
import Notes from '@/components/note'
import React from 'react'
import { useSessionContext } from '@/components/sessionprovider'

export default function page() {
  const {userData} = useSessionContext()
  return (
    <Notes userId={userData?.id}/>
  )
}
