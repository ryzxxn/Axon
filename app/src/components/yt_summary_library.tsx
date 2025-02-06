import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import Link from 'next/link';
import Image from 'next/image';
import { Youtube } from 'lucide-react';

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
                <div className='flex items-center justify-start leading-none gap-2 w-full text-gray-200 text-[1.4rem]'>
                    <h1 className="font-bold leading-none text-[1.4rem]">Your Videos:</h1>
                    <p className='font-bold'>{videos.length}</p>
                </div>
            </div>
            
            {isLoadingVideos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 place-content-between">
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col justify-between shadow-md p-0 rounded-md gap-6 bg-[rgb(51,51,51)] min-h-[8rem]"
                        >
                            <div className='p-2 flex gap-3 flex-col'>
                                <div className="h-10 bg-[rgb(31,31,31)] rounded-sm"></div>
                                <div className="h-4 bg-[rgb(31,31,31)] rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 place-content-between cursor-pointer p-0 py-4">
                        {videos.map((video: any) => (
                            <Link
                                href={`/dashboard/youtube/${video.video_id}`}
                                key={video.video_id}
                                className="flex flex-col justify-between shadow-md rounded-md gap-0"
                            >
                                <Image
                                    src='/youtube.png'
                                    alt={video.title}
                                    className="rounded-t-sm w-full bg-white"
                                    width={200}
                                    height={200}
                                    quality={50}
                                />
                                <h2 className="text-[.8rem] h-[50px] overflow-hidden py-2 px-2 line-clamp-2 bg-[rgb(31,31,31)] text-gray-200 rounded-b-md">
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
