'use client';

import { useState } from 'react';
import VideoInfo from './VideoInfo';
import RestrictedContentNotice from './RestrictedContentNotice';
import { VideoResponse } from '../types/video';
import { useTheme } from 'next-themes';

export default function VideoSearch() {
    const [url, setUrl] = useState('');
    const [videoData, setVideoData] = useState<VideoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputError, setInputError] = useState('');
    const { theme, setTheme } = useTheme();

    const validateYoutubeUrl = (url: string): boolean => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return pattern.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            setInputError('Please enter a YouTube URL');
            return;
        }

        if (!validateYoutubeUrl(url)) {
            setInputError('Please enter a valid YouTube URL');
            return;
        }

        setInputError('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/youtube/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Could not get video information');
            }

            const videoInfo = await response.json();
            setVideoData(videoInfo);
        } catch (error) {
            console.error('Error retrieving video information:', error);
            setError(error instanceof Error ? error.message : 'Could not get video information');
            setVideoData(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <RestrictedContentNotice />

            <form onSubmit={handleSubmit} className="w-full">
                {/* Google-style search input */}
                <div className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter YouTube video URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className={`text-black dark:text-white w-full py-4 px-5 pr-12 border ${inputError ? 'border-red-500' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent shadow-sm hover:shadow-md transition-shadow dark:bg-dark-bg-secondary dark:border-gray-700 dark:text-dark-text-primary`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    {inputError && (
                        <p className="mt-2 text-red-600 text-sm">{inputError}</p>
                    )}

                    <div className="mt-4 flex justify-center space-x-3">
                        <button
                            type="submit"
                            className="px-5 py-2 bg-youtube-red hover:bg-youtube-darkred text-white rounded-md font-medium text-m transition-colors w-36"
                        >
                            Get Info
                        </button>
                    </div>
                </div>
            </form>

            {isLoading && (
                <div className="mt-8 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-youtube-red"></div>
                </div>
            )}

            {error && (
                <div className="mt-8 w-full max-w-3xl p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400">
                    <p>{error}</p>
                </div>
            )}

            {videoData && !isLoading && (
                <div className="mt-8 w-full max-w-4xl">
                    <VideoInfo videoData={videoData} />
                </div>
            )}
        </div>
    );
} 