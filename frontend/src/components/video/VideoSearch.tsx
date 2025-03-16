import { useState, memo, useEffect } from 'react';
import { YoutubeService } from '../../services/api';
import { VideoResponse } from '../../types/video.types';

interface VideoSearchProps {
    initialValue?: string;
    onVideoInfo?: (data: VideoResponse) => void;
    onError?: (message: string) => void;
    onLoadingChange?: (loading: boolean) => void;
}

const VideoSearch = ({
    initialValue = '',
    onVideoInfo = () => { },
    onError = () => { },
    onLoadingChange = () => { }
}: VideoSearchProps) => {
    const [url, setUrl] = useState(initialValue);
    const [inputError, setInputError] = useState('');

    // Update url when initialValue changes
    useEffect(() => {
        if (initialValue && initialValue !== url) {
            setUrl(initialValue);
        }
    }, [initialValue, url]);

    const validateYoutubeUrl = (url: string): boolean => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
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
        onLoadingChange(true);

        try {
            console.log('Sending request to fetch video info for URL:', url);
            const videoInfo = await YoutubeService.getVideoInfo(url);
            console.log('Received video info response:', videoInfo);

            if (!videoInfo || !videoInfo.videoDetails) {
                throw new Error('Invalid response format from server');
            }

            onVideoInfo(videoInfo);
        } catch (error) {
            console.error('Error fetching video info:', error);
            onError(error instanceof Error ? error.message : 'Failed to fetch video information');
        } finally {
            onLoadingChange(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            {/* Google-style search input */}
            <div className="relative">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Enter YouTube video URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className={`w-full py-4 px-5 pr-12 border ${inputError ? 'border-red-500' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent shadow-sm hover:shadow-md transition-shadow`}
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
    );
};

export default memo(VideoSearch); 