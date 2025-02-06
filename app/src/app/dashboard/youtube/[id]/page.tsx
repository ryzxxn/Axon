'use client'
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Link2, MessageCircle } from 'lucide-react';
import ChatComponent from '@/components/chat';
import { useSessionContext } from '@/components/sessionprovider';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function VideoDetailsPage() {
    const { userData } = useSessionContext();
    const { id }: { id: string } = useParams();
    const [videoDetails, setVideoDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [toggleChat, setToggleChat] = useState<boolean>(false);
    const [user_id, setUser_id] = useState<string>('');

    useEffect(() => {
        if (id) {
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

    useEffect(() => {
        if (userData) {
            setUser_id(userData.id);
        }
    }, [userData, videoDetails]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!videoDetails) return <p>Video not found.</p>;

    const videourl = "https://www.youtube.com/watch?v="+ id

    return (
        <div className='flex max-h-screen relative'>
            {/* Video Content Section */}
            <div className='overflow-y-scroll flex flex-col w-full'>
                {/* Header Section */}
                <div className='flex justify-between p-2 font-bold text-1xl items-center bg-[rgb(14,14,14)] text-white border-b sticky top-0 border-[rgb(31,31,31)] z-10'>
                    <p className='leading-none'>{videoDetails.title}</p>
                    <div className='flex p-1 bg-[rgb(21,21,21)] leading-none rounded-2xl gap-2'>
                        <div className='relative flex justify-end p-2 cursor-pointer hover:bg-gray-700 rounded-xl' onClick={() => setToggleChat(!toggleChat)}  >
                            <MessageCircle className='w-4'/>
                        </div>
                        <Link href={videourl} className='relative flex justify-end p-2 cursor-pointer hover:bg-gray-700 rounded-xl'>
                            <Link2 className='w-4'/>
                        </Link>
                    </div>
                    
                </div>

                {/* Chat Overlay */}
                {toggleChat && (
                    <div className='fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-20 px-[3vw] max-h-screen min-h-screen'>
                        <div className='w-full p-4 rounded-lg shadow-lg relative'>
                            <button 
                                className='absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2 z-20'
                                onClick={() => setToggleChat(false)}
                            >
                                ✖
                            </button>
                            <ChatComponent videoId={videoDetails.id} userId={user_id} video_id={id} />
                        </div>
                    </div>
                )}

                {/* Video Thumbnail */}
                {/* <Image
                    src={videoDetails.thumbnail}
                    alt={videoDetails.title}
                    className='w-full h-auto p-4 sm:w-full md:w-full lg:w-1/2 rounded-lg'
                    width={1000}
                    height={1000}
                    quality={50}
                /> */}

                {/* Video Summary */}
                <div className='px-4 flex flex-col flex-1 h-full text-white relative'>
                    <p className='font-bold text-2xl'>Summary</p>
                    <ReactMarkdown>{videoDetails.summarized_text}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
