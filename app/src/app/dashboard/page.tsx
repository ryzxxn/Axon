'use client'
import React from 'react'
import Dash_Notes from '@/components/dash_recent_notes'
import { useSessionContext } from '@/components/sessionprovider'
import YoutubeSummaryLibrary from '@/components/yt_summary_library'
import YoutubeRecentVideosLibrary from '@/components/dash_recent_videos'

export default function page() {

  const {userData} = useSessionContext()

  if (!userData) {
    return <p>loading</p>
  }

  return (
    <>
    <div className='p-6 flex flex-col gap-4'>
        <Dash_Notes userId={userData.id}/>
        <YoutubeRecentVideosLibrary/>
    </div>
    </>
  )
}
