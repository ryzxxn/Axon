'use client';
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useSessionContext } from '@/components/sessionprovider';
import MarkdownRenderer from '@/components/markdown';

export default function YouTubeTranscript() {
    const { userData, loading } = useSessionContext();

    if (loading) {
        return <p>Loading...</p>;
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
        <div className="min-h-screen flex flex-col bg-white py-5 px-5 gap-6 w-full">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">YouTube Summary</h1>
                <p>Summarize YouTube videos effortlessly</p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-md bg-white shadow-sm rounded-lg flex flex-col justify-evenly gap-4 w-full">
                <label className="">
                    <span className="text-gray-700 font-medium">Enter YouTube URL</span>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                        placeholder="https://www.youtube.com/watch?v="
                    />
                </label>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={loadingTranscript}
                >
                    {loadingTranscript ? (
                        <div>
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <p>Scan video</p>
                    )}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            {title && (
                <div className="w-full bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">
                        {loadingTranscript ? (
                            <div className="skeleton-loader w-3/4 h-6 bg-gray-200 rounded-md" />
                        ) : (
                            title
                        )}
                    </h2>
                    {thumbnail && !loadingTranscript ? (
                        <img src={thumbnail} alt={title} className="w-full rounded-md mb-4" />
                    ) : (
                        <div className="skeleton-loader w-full h-48 bg-gray-200 rounded-md mb-4" />
                    )}
                    {summary && (
                        <div className='p-4 bg-gray-100 rounded-md'>
                            <h2 className='text-xl font-bold text-gray-800'>Summary</h2>
                            <MarkdownRenderer content={summary}/>
                        </div>
                    )}
                    {/* <pre className="bg-gray-100 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
                        {summary}
                    </pre> */}
                </div>
            )}
            {/* {userData && (
                <div>
                    <h1>Welcome, {userData.username}!</h1>
                    <p>Email: {userData.email}</p>
                    <p>ID: {userData.id}</p>
                </div>
            )} */}
        </div>
    );
}
