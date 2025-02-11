'use client';
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
    const [user_id, setUser_id] = useState<string>('');
    const [toggleChat, setToggleChat] = useState<boolean>(false);

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

    useEffect(() => {
        if (toggleChat) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [toggleChat]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!videoDetails) return <p>Video not found.</p>;

    const videourl = "https://www.youtube.com/watch?v=" + id;

    return (
        <div className='flex flex-col max-h-screen relative'>
            {/* Video Content Section */}
            <div className='flex flex-col flex-1'>
                {/* Header Section */}
                <div className='flex justify-between p-4 font-bold text-xl items-center text-gray-600 sticky top-0 border-b z-10 bg-white'>
                    <p className='leading-none'>{videoDetails.title}</p>
                    <div className='flex p-1 border leading-none rounded-2xl gap-2'>
                        <div
                            className='relative flex justify-end p-2 cursor-pointer hover:bg-gray-700 rounded-xl'
                            onClick={() => setToggleChat(!toggleChat)}
                        >
                            <MessageCircle className='w-4' />
                        </div>
                        <Link href={videourl} className='relative flex justify-end p-2 cursor-pointer hover:bg-gray-700 rounded-xl'>
                            <Link2 className='w-4' />
                        </Link>
                    </div>
                </div>

                {/* Chat Section */}
                {toggleChat && (
                    <div className='fixed inset-0 flex items-center justify-center bg-black/70 z-10'>
                        <div className='min-w-[80vw] max-w-md p-4 rounded-lg shadow-lg relative'>
                            <ChatComponent
                                videoId={videoDetails.id}
                                userId={user_id}
                                video_id={id}
                                toggleChat={toggleChat}
                                setToggleChat={setToggleChat}
                            />
                        </div>
                    </div>
                )}

                {/* Video Summary */}
                <div className='px-4 py-4 flex flex-col flex-1 h-full text-gray-600 relative'>
                    <p className='font-bold text-2xl'>Summary</p>
                    <ReactMarkdown>{videoDetails.summarized_text}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
