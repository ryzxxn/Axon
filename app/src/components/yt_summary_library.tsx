import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import Link from 'next/link';
import Image from 'next/image';
import { Circle, Youtube } from 'lucide-react';

export default function YoutubeSummaryLibrary() {
    const { userData, loading } = useSessionContext();
    const [videos, setVideos] = useState<any>([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);

    useEffect(() => {
        if (userData && userData.id) {
            // Fetch previously scanned videos
            axiosInstance
                .get(`/api/videos?user_id=${userData.id}`)
                .then(response => {
                    setVideos(response.data);
                })
                .catch(error => {
                    console.error('Error fetching videos:', error);
                })
                .finally(() => {
                    setIsLoadingVideos(false);
                });
        }
    }, [userData]);

    if (loading) {
        return <></>;
    }

    if (!userData) {
        return <p>Please log in to use this feature.</p>;
    }

    return (
        <div>
            <div className='flex flex-col w-full'>
                <div className='flex items-center justify-start leading-none gap-2 w-full text-gray-600 text-[1.4rem]'>
                    <h1 className="font-bold leading-none text-[1.4rem]">Your Videos:</h1>
                    <p className='font-bold'>{videos.length}</p>
                </div>
            </div>
            
            {isLoadingVideos ? (
                <div className="flex w-full justify-center items-center py-[5rem]">
                    <Circle className='text-white w-10'/>
                </div>
            ) : videos.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 place-content-between cursor-pointer p-0 py-4">
                        {videos.map((video: any) => (
                            <Link
                                href={`/dashboard/youtube/${video.video_id}`}
                                key={video.video_id}
                                className="flex flex-col justify-between shadow-md rounded-md gap-0 border"
                            >
                                <div className='min-h-[90px] max-h-[192px] w-full rounded-t-lg p-8 shadow-md flex justify-center items-center gap-1 bg'>
                                <Image
                                    src='/axonn.svg'
                                    alt={video.title}
                                    className="rounded-t-sm h-6 w-6 animate-none"
                                    width={50}
                                    height={50}
                                    quality={50}
                                />
                                <p>Youtube</p>
                                </div>
                                <h2 className="text-[.8rem] h-[50px] overflow-hidden py-2 px-2 line-clamp-2 text-gray-600 rounded-b-md">
                                    {video.title}
                                </h2>
                            </Link>
                        ))}
                    </div>
                </>
            ) : (
                <p>No videos found.</p>
            )}
        </div>
    );
}
