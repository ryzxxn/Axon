'use client'
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import ChatComponent from '@/components/chat';
import { useSessionContext } from '@/components/sessionprovider';
import ReactMarkdown from 'react-markdown'

export default function VideoDetailsPage() {

    const {userData} = useSessionContext()
    const { id }:{id:string} = useParams();
    const [videoDetails, setVideoDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    // const [toggleTranscript, setToggleTranscript] = useState<boolean>(false);
    const [toggleChat, setToggleChat] = useState<boolean>(true);
    const [user_id, setUser_id] = useState<string>('')

    useEffect(() => {
        if (id) {
            // Fetch video details
            axiosInstance.get(`/api/video_details?video_id=${id}`)
                .then(response => {
                    setVideoDetails(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching video details:', error);
                    setError('Failed to fetch video details');
                    setLoading(false);
                });
        }
    }, [id]);

    useEffect(() =>{
        if (userData) {
            setUser_id(userData.id)
        }
        
    },[userData, videoDetails])

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!videoDetails) {
        return <p>Video not found.</p>;
    }

    return (
        <div className='flex max-h-[calc(100vh-50px)]'>
            <div className='flex flex-1 flex-col border-r h-full'>
                <div className='flex justify-between p-2 font-bold text-1xl bg-white items-center border-b sticky top-0'>
                    <p className='leading-none'>{videoDetails.title}</p>
                    <div className='relative flex justify-end p-2'>
                        <MessageCircle onClick={() => setToggleChat(!toggleChat)} />
                    </div>
                </div>
                <Image
                    src={videoDetails.thumbnail}
                    alt={videoDetails.title}
                    className='w-full h-auto p-4 sm:w-full md:w-full lg:w-1/2 rounded-lg'
                    width={1000}
                    height={1000}
                    quality={50}
                />
                <div className='px-4 flex flex-col flex-1 h-full'>
                    <p className='font-bold text-2xl'>Summary</p>
                    <ReactMarkdown>{videoDetails.summarized_text}</ReactMarkdown>
                </div>
                {/* <div className='p-4 flex flex-col gap-4 justify-center'>
                    <div className='flex justify-between'>
                        <p className='font-bold text-2xl'>Video Transcript</p>
                        {toggleTranscript ? (
                            <p
                                className='bg-black text-white p-2 rounded-md cursor-pointer text-sm'
                                onClick={() => setToggleTranscript(!toggleTranscript)}
                            >
                                Show less
                            </p>
                        ) : (
                            <p
                                className='bg-black text-white p-2 rounded-md cursor-pointer text-sm'
                                onClick={() => setToggleTranscript(!toggleTranscript)}
                            >
                                Show more
                            </p>
                        )}
                    </div>
                    {toggleTranscript && (
                        <p className='font-mono text-sm p-2 bg-gray-200 rounded-md'>
                            {videoDetails.transcript}
                        </p>
                    )}
                </div> */}
                
            </div>
                {toggleChat && (
                    <div className='flex h-full flex-1'>
                    <ChatComponent videoId={videoDetails.id} userId={user_id} video_id={id}/>
                    </div>
                )}
        </div>
    );
}