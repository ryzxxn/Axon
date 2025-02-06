'use client';
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import YoutubeSummaryLibrary from '@/components/yt_summary_library';

import ReactMarkdown from 'react-markdown'
import { Youtube } from 'lucide-react';

export default function YouTubeTranscript() {
    const { userData, loading } = useSessionContext();

    if (loading) {
        return <p></p>;
    }

    if (!userData) {
        return <p className='text-white'>Please log in to use this feature.</p>;
    }

    const [url, setUrl] = useState('');
    // const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [user_id, setUser_id] = useState('');
    const [loadingTranscript, setLoadingTranscript] = useState(false);

    useEffect(() => {
        if (userData) {
            setUser_id(userData.id);
        }
    }, [userData]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        // setTranscript('');
        setTitle('');
        setThumbnail('');
        setLoadingTranscript(true);

        try {
            const response = await axiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/getyttranscript`, {
                video_url: url,
                user_id: user_id
            });

            // setTranscript(response.data.transcript);
            setSummary(response.data.summary)
            setTitle(response.data.title);
            setThumbnail(response.data.thumbnail);
        } catch (error) {
            
        } finally {
            setLoadingTranscript(false);
        }
    };

    return (
        <>
        <div className='w-full flex flex-col'>
            <div className='p-4 text-gray-200 flex items-center gap-0 flex-col justify-start border-b  border-[rgb(31,31,31)]'>
                <div className='flex flex-col w-full'>
                    <div className='flex items-center justify-start leading-none gap-2 w-full text-gray-20'>
                        <Youtube className='size-[3rem] leading-none'/>
                        <h1 className="font-bold leading-none text-[1.4rem]">YouTube Summary</h1>
                    </div>
                    <p className='text-[.8rem]'>Effortlessly generate a comprehensive summary of the YouTube video</p>
                </div>

                <form onSubmit={handleSubmit} className=" w-full">
                    <div className='flex items-center gap-4'>
                        <div className="flex gap-2 flex-col w-full">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className=" bg-transparent border-b px-3  py-2 placeholder:text-[rgb(61,61,61)] outline-none"
                                placeholder="https:www.youtube.com/watch?v="
                            />
                        </div> 
                        <button
                            type="submit"
                            className="w-[max-content] text-[.9rem] text-nowrap bg-[rgb(24,24,24)] text-white  disabled:bg-black disabled:text-white disabled:cursor-not-allowed p-2 rounded-md border-none"
                            disabled={loadingTranscript}
                        >
                            {loadingTranscript ? (
                                <div>
                                    <p>Loading...</p>
                                </div>
                            ) : (
                                <p>Summarize</p>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            
            {title && (
                <div className='p-4 relative'>
                <div className="w-full shadow-md rounded-lg gap-4 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-gray-200">
                        {loadingTranscript ? (
                            <div className="skeleton-loader w-3/4 h-6 bg-gray-200 rounded-md" />
                        ) : (
                            <p className='text-4xl leading-none'>{title}</p>
                        )}
                    </h2>

                    <div className=''>
                        {thumbnail && !loadingTranscript ? (
                            <img src={thumbnail} alt={title} className="rounded-md w-full object-cover max-h-[150px]" />
                        ) : (
                            <div className="skeleton-loader w-full h-48 bg-gray-200 rounded-md mb-4" />
                        )}
                    </div>

                    <div>
                        {summary && (
                            <div className='p-0 text-gray-200 rounded-md flex flex-col'>
                                <h2 className='text-[2rem] italic font-bold text-gray-200'>Summary</h2>
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
                </div>
             )}
            
            <div className='p-4'>
                <YoutubeSummaryLibrary/>
            </div>
        </div>
        </>
    )
}