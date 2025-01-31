import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import Link from 'next/link';
import Image from 'next/image';

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
        return <p>Loading session...</p>;
    }

    if (!userData) {
        return <p>Please log in to use this feature.</p>;
    }

    return (
        <div>
            <div className='flex items-center justify-between'>
                <p className="font-bold text-2xl py-3 text-gray-700">Your Videos</p>
                <div className="flex">
                    <h3 className="font-semibold text-gray-700">Total Videos:</h3>
                    <p>{videos.length}</p>
                </div>
            </div>
            
            {isLoadingVideos ? (
                <div className="grid grid-cols-6 gap-4 place-content-between">
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse flex flex-col justify-between shadow-md p-3 rounded-md gap-3 bg-gray-200"
                        >
                            <div className="h-10 bg-gray-300 rounded-sm"></div>
                            <div className="h-4 bg-gray-300 rounded"></div>
                            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : videos.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 place-content-between cursor-pointer p-4">
                        {videos.map((video: any) => (
                            <Link
                                href={`/dashboard/youtube/${video.video_id}`}
                                key={video.video_id}
                                className="flex flex-col justify-between shadow-md rounded-md gap-0"
                            >
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="rounded-t-sm w-full"
                                    width={200}
                                    height={200}
                                    quality={50}
                                />
                                <h2 className="text-[.8rem] h-[50px] overflow-hidden py-2 px-2 line-clamp-2">
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
