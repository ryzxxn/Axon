'use client';
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import YoutubeSummaryLibrary from '@/components/yt_summary_library';

import ReactMarkdown from 'react-markdown'

export default function YouTubeTranscript() {
    const { userData, loading } = useSessionContext();

    if (loading) {
        return <p></p>;
    }

    if (!userData) {
        return <p>Please log in to use this feature.</p>;
    }

    const [url, setUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [error, setError] = useState('');
    const [user_id, setUser_id] = useState('');
    const [loadingTranscript, setLoadingTranscript] = useState(false);

    useEffect(() => {
        if (userData) {
            setUser_id(userData.id);
        }
    }, [userData]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setTranscript('');
        setTitle('');
        setThumbnail('');
        setLoadingTranscript(true);

        try {
            const response = await axiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/getyttranscript`, {
                video_url: url,
                user_id: user_id
            });

            setTranscript(response.data.transcript);
            setSummary(response.data.summary)
            setTitle(response.data.title);
            setThumbnail(response.data.thumbnail);
        } catch (error) {
            setError('Error fetching transcript. Please check the URL and try again.');
        } finally {
            setLoadingTranscript(false);
        }
    };

    return (
        <div className="flex flex-col p-5 flex-1 h-full">
            <div className='py-4'>
                <h1 className="text-2xl font-bold text-gray-700">YouTube Summary</h1>
                <p className='text-sm'>Effortlessly summarize YouTube videos and enhance your understanding with insightful questions.</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white flex flex-col justify-evenly gap-4 w-full">
                <div className='flex flex-1 w-full items-center justify-between gap-4'>
                    <div className="flex gap-2 flex-col w-full">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="block w-full px-3 py-1 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                            placeholder="https://www.youtube.com/watch?v="
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-[max-content] text-nowrap bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        disabled={loadingTranscript}
                    >
                        {loadingTranscript ? (
                            <div>
                                <p>Loading...</p>
                            </div>
                        ) : (
                            <p>Summarize Video</p>
                        )}
                    </button>
                </div>
            </form>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            {title && (
                <div className="w-full bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        {loadingTranscript ? (
                            <div className="skeleton-loader w-3/4 h-6 bg-gray-200 rounded-md" />
                        ) : (
                            <p className='text-4xl'>{title}</p>
                        )}
                    </h2>
                    {thumbnail && !loadingTranscript ? (
                        <img src={thumbnail} alt={title} className="rounded-md mb-4 w-1/3" />
                    ) : (
                        <div className="skeleton-loader w-full h-48 bg-gray-200 rounded-md mb-4" />
                    )}
                    {summary && (
                        <div className='p-4 bg-gray-100 rounded-md'>
                            <h2 className='text-2xl font-bold text-gray-700'>Summary</h2>
                           <ReactMarkdown>{summary}</ReactMarkdown>
                            <p>{summary}</p>
                        </div>
                    )}
                </div>
            )}
            <YoutubeSummaryLibrary/>
        </div>
    );
}
